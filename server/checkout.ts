import type { Express, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { storage, type LedgerEntry } from "./storage";
import { sendPaymentReceipt } from "./email";
import { decryptField } from "./crypto";
import {
  cartLineError,
  eurosToCents,
  listedUnitPrice,
} from "@shared/checkout";
import type { CartSnapshotLine, Payment } from "@shared/schema";

interface AuthRequest extends Request {
  user?: { id: string };
}

function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await storage.getProfile(req.user.id);
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export function earningCents(amount: string): number {
  const value = parseFloat(amount);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

/** Seller and reseller shares of a sale that are owed (non-zero). */
export function payoutShares(txn: { sellerId: string; marchantId: string; sellerEarning: string; marchantEarning: string }): Array<{
  role: "seller" | "marchand";
  userId: string;
  amount: string;
}> {
  return [
    { role: "seller" as const, userId: txn.sellerId, amount: txn.sellerEarning },
    { role: "marchand" as const, userId: txn.marchantId, amount: txn.marchantEarning },
  ].filter((share) => earningCents(share.amount) > 0);
}

async function createOwedPayouts(paymentId: number, currency: string): Promise<void> {
  const txns = await storage.getTransactionsByPayment(paymentId);
  for (const txn of txns) {
    for (const share of payoutShares(txn)) {
      await storage.createPayoutIfMissing({
        paymentId,
        transactionId: txn.id,
        userId: share.userId,
        role: share.role,
        amount: share.amount,
        currency,
      });
    }
  }
}

export function appBaseUrl(): string {
  return process.env.APP_BASE_URL || "http://localhost:5000";
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY is not set"), { statusCode: 500 });
  }
  return new Stripe(key);
}

export function saleSplit(price: number, sellerPct: number, marchantPct: number) {
  const sellerAmt = parseFloat(((price * sellerPct) / 100).toFixed(2));
  const marchantAmt = parseFloat(((price * marchantPct) / 100).toFixed(2));
  const platformAmt = parseFloat((price - sellerAmt - marchantAmt).toFixed(2));
  return { sellerAmt, marchantAmt, platformAmt };
}

export function planLineFulfillment(input: {
  paymentId: number;
  itemStatus: string;
  existingPaymentId: number | null | undefined;
}): "create" | "skip" | "attach" {
  if (input.itemStatus === "sold" && input.existingPaymentId === input.paymentId) return "skip";
  if (input.itemStatus === "sold") return "attach";
  return "create";
}

function lineErrorMessage(code: string): string {
  switch (code) {
    case "not_found":
      return "Item not found";
    case "not_listed":
      return "Only listed items can be purchased";
    case "own_item":
      return "You cannot purchase your own item";
    case "no_reseller":
      return "This item is not assigned to a reseller";
    case "invalid_price":
      return "This item does not have a valid price";
    default:
      return "Item cannot be purchased";
  }
}

async function buildSnapshot(userId: string): Promise<CartSnapshotLine[]> {
  const rows = await storage.getCart(userId);
  if (rows.length === 0) {
    throw Object.assign(new Error("Your cart is empty"), { statusCode: 400 });
  }
  const lines: CartSnapshotLine[] = [];
  for (const row of rows) {
    const error = cartLineError(row.item, userId);
    if (error) {
      throw Object.assign(new Error(`${row.item.title}: ${lineErrorMessage(error)}`), { statusCode: 400 });
    }
    const price = listedUnitPrice(row.item);
    const tier = await storage.getTierForPrice(price);
    if (!tier) {
      throw Object.assign(
        new Error(`No fee tier covers €${price}. Configure a fee tier before checkout.`),
        { statusCode: 400 },
      );
    }
    lines.push({
      itemId: row.item.id,
      title: row.item.title,
      unitAmount: price.toFixed(2),
      quantity: 1,
      sellerId: row.item.sellerId,
      marchantId: row.item.marchantId as string,
      requestId: row.item.requestId,
    });
  }
  return lines;
}

export async function fulfillPaidCheckout(
  sessionId: string,
  paymentIntentId: string | null,
): Promise<{ payment: Payment; alreadyPaid: boolean }> {
  const payment = await storage.getPaymentBySession(sessionId);
  if (!payment) {
    throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  }
  if (payment.status === "paid") {
    return { payment, alreadyPaid: true };
  }

  const lines = payment.cartSnapshot || [];
  for (const line of lines) {
    const item = await storage.getItem(line.itemId);
    const existing = await storage.getTransactionByItemId(line.itemId);
    const plan = planLineFulfillment({
      paymentId: payment.id,
      itemStatus: item?.status || "missing",
      existingPaymentId: existing?.paymentId,
    });
    if (plan === "skip") continue;

    const price = parseFloat(line.unitAmount);
    const tier = await storage.getTierForPrice(price);
    if (!tier) {
      throw Object.assign(new Error(`No fee tier covers €${price}`), { statusCode: 400 });
    }
    const sellerPct = parseFloat(tier.sellerPercent as string);
    const marchantPct = parseFloat(tier.marchantPercent as string);
    const platformPct = parseFloat(tier.platformPercent as string);
    const split = saleSplit(price, sellerPct, marchantPct);
    const stripeFields = {
      paymentId: payment.id,
      payerUserId: payment.userId,
      stripeCheckoutSessionId: payment.stripeCheckoutSessionId,
      stripePaymentIntentId: paymentIntentId,
      salePrice: line.unitAmount,
      sellerEarning: split.sellerAmt.toFixed(2),
      marchantEarning: split.marchantAmt.toFixed(2),
      platformEarning: split.platformAmt.toFixed(2),
      feeTierId: tier.id,
      sellerPercent: sellerPct.toString(),
      marchantPercent: marchantPct.toString(),
      platformPercent: platformPct.toString(),
      status: "completed" as const,
    };

    if (plan === "attach" && existing) {
      await storage.updateTransaction(existing.id, stripeFields);
      continue;
    }

    if (item && item.status !== "sold") {
      await storage.updateItem(item.id, {
        status: "sold",
        salePrice: line.unitAmount,
        soldAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (existing) {
      await storage.updateTransaction(existing.id, stripeFields);
    } else if (item) {
      await storage.createTransaction({
        itemId: item.id,
        requestId: line.requestId,
        sellerId: line.sellerId,
        marchantId: line.marchantId,
        ...stripeFields,
      });
      await storage.createNotification({
        userId: line.sellerId,
        type: "item_sold",
        title: "Item Sold!",
        message: `"${line.title}" sold for ${line.unitAmount} EUR.`,
        link: "/items",
      });
    }
  }

  const paid = await storage.markPaymentPaid(payment.id, paymentIntentId);
  await storage.removeCartItems(payment.userId, lines.map((line) => line.itemId));
  await createOwedPayouts(payment.id, payment.currency);
  return { payment: paid || { ...payment, status: "paid" }, alreadyPaid: false };
}

async function sendReceiptIfNeeded(payment: Payment): Promise<void> {
  if (payment.receiptSentAt) return;
  const payer = await storage.getUserById(payment.userId);
  if (!payer?.email) return;
  const name = `${payer.firstName || ""} ${payer.lastName || ""}`.trim() || payer.email;
  await sendPaymentReceipt({
    toEmail: payer.email,
    toName: name,
    amount: payment.amount,
    currency: payment.currency,
    sessionId: payment.stripeCheckoutSessionId,
    items: (payment.cartSnapshot || []).map((line) => ({
      title: line.title,
      amount: line.unitAmount,
    })),
  });
  await storage.markReceiptSent(payment.id);
}

export async function syncCheckoutFromStripe(sessionId: string): Promise<{
  payment: Payment;
  alreadyPaid: boolean;
  stripeStatus: string;
}> {
  const existing = await storage.getPaymentBySession(sessionId);
  if (!existing) {
    throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  }
  if (existing.status === "paid") {
    await sendReceiptIfNeeded(existing);
    await createOwedPayouts(existing.id, existing.currency);
    return { payment: existing, alreadyPaid: true, stripeStatus: "paid" };
  }
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return { payment: existing, alreadyPaid: false, stripeStatus: session.payment_status || "unpaid" };
  }
  const intentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;
  const result = await fulfillPaidCheckout(sessionId, intentId);
  const fresh = await storage.getPaymentBySession(sessionId);
  await sendReceiptIfNeeded(fresh || result.payment);
  return { payment: fresh || result.payment, alreadyPaid: result.alreadyPaid, stripeStatus: "paid" };
}

export function registerCheckoutRoutes(app: Express): void {
  app.get("/api/shop/items", isAuthenticated, async (_req, res) => {
    try {
      const items = await storage.getListedItems();
      res.json(items);
    } catch (error) {
      console.error("Error listing shop items:", error);
      res.status(500).json({ message: "Failed to load shop" });
    }
  });

  app.get("/api/cart", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const rows = await storage.getCart(req.user!.id);
      const lines = rows.map((row) => ({
        itemId: row.item.id,
        title: row.item.title,
        brand: row.item.brand,
        status: row.item.status,
        unitAmount: listedUnitPrice(row.item).toFixed(2),
        photo: row.item.photos?.[0] || null,
        purchasable: cartLineError(row.item, req.user!.id) === null,
      }));
      const total = lines.reduce((sum, line) => sum + parseFloat(line.unitAmount), 0);
      res.json({ lines, total: total.toFixed(2), currency: "eur" });
    } catch (error) {
      console.error("Error loading cart:", error);
      res.status(500).json({ message: "Failed to load cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const itemId = Number(req.body?.itemId);
      if (!Number.isInteger(itemId)) {
        return res.status(400).json({ message: "itemId is required" });
      }
      const item = await storage.getItem(itemId);
      const error = cartLineError(item, req.user!.id);
      if (error) {
        return res.status(400).json({ message: lineErrorMessage(error) });
      }
      const cartItem = await storage.addCartItem(req.user!.id, itemId);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.delete("/api/cart/:itemId", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const itemParam = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const itemId = parseInt(itemParam, 10);
      await storage.removeCartItem(req.user!.id, itemId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove item" });
    }
  });

  app.post("/api/checkout/sessions", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const lines = await buildSnapshot(user.id);
      const total = lines.reduce((sum, line) => sum + parseFloat(line.unitAmount), 0);
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        line_items: lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: eurosToCents(parseFloat(line.unitAmount)),
            product_data: {
              name: line.title,
              metadata: { itemId: String(line.itemId) },
            },
          },
        })),
        success_url: `${appBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appBaseUrl()}/checkout/cancel`,
        metadata: { userId: user.id },
      });
      if (!session.url || !session.id) {
        return res.status(502).json({ message: "Stripe did not return a checkout URL" });
      }
      await storage.createPayment({
        userId: user.id,
        stripeCheckoutSessionId: session.id,
        amount: total.toFixed(2),
        currency: "eur",
        cartSnapshot: lines,
      });
      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      const status = error?.statusCode || 500;
      if (status >= 500) console.error("Error creating checkout session:", error);
      res.status(status).json({ message: error?.message || "Failed to start checkout" });
    }
  });

  app.get("/api/checkout/sessions/:sessionId", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const payment = await storage.getPaymentBySession(sessionId);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      if (payment.userId !== req.user!.id) {
        const profile = await storage.getProfile(req.user!.id);
        if (profile?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
      }
      const synced = await syncCheckoutFromStripe(sessionId);
      res.json({
        status: synced.payment.status,
        stripeStatus: synced.stripeStatus,
        amount: synced.payment.amount,
        currency: synced.payment.currency,
        items: synced.payment.cartSnapshot,
        paidAt: synced.payment.paidAt,
      });
    } catch (error: any) {
      const status = error?.statusCode || 500;
      if (status >= 500) console.error("Error loading checkout session:", error);
      res.status(status).json({ message: error?.message || "Failed to load payment" });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers["stripe-signature"];
    if (!secret || typeof signature !== "string") {
      return res.status(400).json({ message: "Missing Stripe webhook signature" });
    }
    let event: Stripe.Event;
    try {
      const raw = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!raw) return res.status(400).json({ message: "Missing raw body" });
      event = getStripe().webhooks.constructEvent(raw, signature, secret);
    } catch (error) {
      console.error("Stripe webhook signature failed:", error);
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid" && session.id) {
          const intentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null;
          const result = await fulfillPaidCheckout(session.id, intentId);
          const fresh = await storage.getPaymentBySession(session.id);
          await sendReceiptIfNeeded(fresh || result.payment);
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook handler failed:", error);
      res.status(500).json({ message: "Webhook handler failed" });
    }
  });

  app.get("/api/admin/transactions", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const userId = typeof req.query.userId === "string" && req.query.userId ? req.query.userId : undefined;
      const entries: LedgerEntry[] = await storage.listLedger(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error listing transactions:", error);
      res.status(500).json({ message: "Failed to list transactions" });
    }
  });

  app.get("/api/payouts", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      res.json(await storage.listPayoutsForUser(req.user!.id));
    } catch (error) {
      console.error("Error listing payouts:", error);
      res.status(500).json({ message: "Failed to load payouts" });
    }
  });

  app.get("/api/admin/payouts", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" && req.query.status ? req.query.status : "owed";
      const rows = await storage.listPayoutsByStatus(status);
      // IBAN is decrypted only for this admin-only response; the ciphertext is not sent.
      res.json(rows.map(({ bankIbanEncrypted, ...row }) => ({
        ...row,
        bankIban: bankIbanEncrypted ? decryptField(bankIbanEncrypted) : null,
      })));
    } catch (error) {
      console.error("Error listing admin payouts:", error);
      res.status(500).json({ message: "Failed to list payouts" });
    }
  });

  app.post("/api/admin/payouts/:id/paid", isAuthenticated, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const reference = typeof req.body?.transferReference === "string" ? req.body.transferReference.trim() : "";
      if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid payout id" });
      if (!reference || reference.length > 255) {
        return res.status(400).json({ message: "A transfer reference is required (max 255 characters)" });
      }
      const row = await storage.markPayoutPaid(id, req.user!.id, reference);
      if (!row) return res.status(404).json({ message: "Payout not found or already paid" });
      res.json(row);
    } catch (error) {
      console.error("Error marking payout paid:", error);
      res.status(500).json({ message: "Failed to mark payout as paid" });
    }
  });
}
