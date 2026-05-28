import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "../shared/models/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, CATEGORY_ALLOWED_FIELDS, NOTIF_PREF_KEYS } from "@shared/constants";
import type { Item, Transaction } from "@shared/schema";
import { sendAgreementReadyEmail } from "./email";
import { signInSchema, hashPassword, verifyPassword } from "./auth";
import { randomUUID, randomBytes } from "crypto";

interface AuthRequest extends Request {
  user?: { id: string };
  cookies: Record<string, string>;
}

function generateVerificationCode(): string {
  const code = Math.floor(randomBytes(4).readUInt32BE(0) % 1000000);
  return code.toString().padStart(6, '0');
}

function resolveItemPrice(i: Pick<Item, "approvedPrice" | "salePrice" | "maxPrice" | "minPrice">): number {
  return parseFloat(i.approvedPrice || i.salePrice || i.maxPrice || i.minPrice || "0");
}

interface TierResolution {
  sellerPct: number;
  marchantPct: number;
  platformPct: number;
  tierId: number | null;
}

async function resolveFeePercentages(price: number): Promise<TierResolution> {
  const tier = await storage.getTierForPrice(price);
  if (tier) {
    return {
      sellerPct: parseFloat(tier.sellerPercent as string),
      marchantPct: parseFloat(tier.marchantPercent as string),
      platformPct: parseFloat(tier.platformPercent as string),
      tierId: tier.id,
    };
  }
  console.warn(`[fee-tier] WARNING: No active fee tier covers price €${price}. Transaction blocked — configure a tier that includes this price range.`);
  throw Object.assign(new Error(`No fee tier covers price €${price}. Please configure a fee tier that includes this price range.`), { statusCode: 400 });
}

async function buildAgreementSnapshot(items: Item[]): Promise<{ itemsSnapshot: string; feeBreakdown: string; totalValue: string }> {
  const snapItems = await Promise.all(items.map(async (i) => {
    const price = resolveItemPrice(i);
    const feeRes = await resolveFeePercentages(price);
    const fees = {
      sellerAmount: parseFloat(((price * feeRes.sellerPct) / 100).toFixed(2)),
      marchantAmount: parseFloat(((price * feeRes.marchantPct) / 100).toFixed(2)),
      platformAmount: parseFloat((price - parseFloat(((price * feeRes.sellerPct) / 100).toFixed(2)) - parseFloat(((price * feeRes.marchantPct) / 100).toFixed(2))).toFixed(2)),
      sellerPct: feeRes.sellerPct,
      marchantPct: feeRes.marchantPct,
      platformPct: feeRes.platformPct,
    };
    return { id: i.id, title: i.title, approvedPrice: price, fees };
  }));
  const totalValue = snapItems.reduce((sum, it) => sum + it.approvedPrice, 0);
  return {
    itemsSnapshot: JSON.stringify(snapItems),
    feeBreakdown: JSON.stringify(snapItems.map((it) => ({ itemId: it.id, title: it.title, salePrice: it.approvedPrice, fees: it.fees }))),
    totalValue: totalValue.toFixed(2),
  };
}

async function notifyAgreementByEmail(
  sellerId: string,
  marchantId: string,
  requestId: number,
  agreementId: number
): Promise<void> {
  try {
    const [sellerUser] = await db.select().from(users).where(eq(users.id, sellerId));
    const [marchantUser] = await db.select().from(users).where(eq(users.id, marchantId));
    const sellerName = sellerUser
      ? `${sellerUser.firstName || ""} ${sellerUser.lastName || ""}`.trim() || sellerUser.email
      : "Seller";
    const marchantName = marchantUser
      ? `${marchantUser.firstName || ""} ${marchantUser.lastName || ""}`.trim() || marchantUser.email
      : "Reseller";
    if (sellerUser?.email) {
      await sendAgreementReadyEmail({
        toEmail: sellerUser.email,
        toName: sellerName || "Seller",
        requestId,
        agreementId,
      });
    }
    if (marchantUser?.email) {
      await sendAgreementReadyEmail({
        toEmail: marchantUser.email,
        toName: marchantName || "Reseller",
        requestId,
        agreementId,
      });
    }
  } catch (err) {
    console.error("[email] Failed to send agreement-ready emails:", err);
  }
}

const wsClients = new Map<string, Set<WebSocket>>();

function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Validation error", errors: result.error.errors });
    }
    req.body = result.data;
    next();
  };
}

const createProfileBody = z.object({
  role: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  siretNumber: z.string().optional(),
  preferredContactMethod: z.string().optional(),
});

const itemFields = {
  description: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  photos: z.array(z.string()).optional(),
  certificatePhotos: z.array(z.string()).optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  vintage: z.string().optional(),
  ageRange: z.string().optional(),
  model: z.string().optional(),
  deviceStorage: z.string().optional(),
  ram: z.string().optional(),
  volume: z.string().optional(),
  frameSize: z.string().optional(),
  instrumentType: z.string().optional(),
  applianceType: z.string().optional(),
  decorStyle: z.string().optional(),
  subcategory: z.string().optional(),
};

const CATEGORY_CONSTRAINED_FIELDS = [
  "brand", "size", "condition", "subcategory",
  "material", "dimensions", "author", "genre", "language",
  "vintage", "ageRange", "model", "deviceStorage", "ram", "volume",
  "frameSize", "instrumentType", "applianceType", "decorStyle",
  "certificatePhotos",
] as const;

function validateCategoryFields(data: { category: string; [key: string]: unknown }, ctx: z.RefinementCtx) {
  const allowed = CATEGORY_ALLOWED_FIELDS[data.category as typeof ITEM_CATEGORIES[number]];
  if (!allowed) return;
  for (const field of CATEGORY_CONSTRAINED_FIELDS) {
    const value = data[field];
    const hasValue = Array.isArray(value) ? value.length > 0 : (value !== undefined && value !== null && value !== "");
    if (hasValue && !allowed.includes(field)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Field '${field}' is not allowed for category '${data.category}'`,
        path: [field],
      });
    }
  }
}

const createItemBody = z.object({
  title: z.string().min(1),
  category: z.enum(ITEM_CATEGORIES),
  ...itemFields,
}).superRefine(validateCategoryFields);

const updateItemBody = z.object({
  title: z.string().min(1).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  ...itemFields,
}).superRefine((data, ctx) => {
  if (data.category) validateCategoryFields(data as { category: string; [key: string]: unknown }, ctx);
});

const createMeetingBody = z.object({
  scheduledDate: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  duration: z.number().optional(),
});

const createMessageBody = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
  requestId: z.number().optional(),
});

export function broadcastToUser(userId: string, data: unknown) {
  const clients = wsClients.get(userId);
  if (!clients) return;
  const payload = JSON.stringify(data);
  Array.from(clients).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profile = await storage.getProfile(req.user.id);
  if (!profile || profile.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerObjectStorageRoutes(app);

  // Rate limiters for auth endpoints
  const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many sign in attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
    message: "Too many registration attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many verification attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
    message: "Too many password reset requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: "Too many password reset attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session loading middleware
  app.use(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const sessionToken = req.cookies["next-auth.session-token"];
    if (sessionToken) {
      try {
        const result = await db.execute(
          sql`SELECT "userId" FROM sessions WHERE "sessionToken" = ${sessionToken} AND expires > NOW()`
        );
        if ((result as any)?.rows?.[0]) {
          req.user = { id: (result as any).rows[0].userId };
        }
      } catch (error) {
        console.error("Error loading session:", error);
      }
    }
    next();
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", async (ws, req: AuthRequest) => {
    // Extract session token from cookies for WebSocket auth
    const cookies = req.headers.cookie?.split('; ').reduce((acc: Record<string, string>, cookie: string) => {
      const [key, value] = cookie.split('=');
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {}) || {};

    const sessionToken = cookies["next-auth.session-token"];

    // Verify session and extract userId
    if (!sessionToken) {
      ws.close(1008, "Unauthorized");
      return;
    }

    try {
      const result = await db.execute(
        sql`SELECT "userId" FROM sessions WHERE "sessionToken" = ${sessionToken} AND expires > NOW()`
      );
      const row = (result as any)?.rows?.[0];
      if (!row || !row.userId) {
        ws.close(1008, "Unauthorized");
        return;
      }

      const userId: string = row.userId;
      if (!wsClients.has(userId)) wsClients.set(userId, new Set());
      wsClients.get(userId)!.add(ws);

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          // userId is already authenticated; reject any attempts to change it
          if (msg.type === "auth") {
            ws.send(JSON.stringify({ type: "auth", success: true, userId }));
          }
        } catch {}
      });

      ws.on("close", () => {
        wsClients.get(userId)?.delete(ws);
      });
    } catch (error) {
      console.error("WebSocket session lookup error:", error);
      ws.close(1011, "Session error");
    }
  });

  app.get(
    "/api/profile",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
      }
    },
  );

  app.post(
    "/api/profile",
    isAuthenticated,
    validate(createProfileBody),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const existing = await storage.getProfile(userId);
        if (existing) {
          return res.status(400).json({ message: "Profile already exists" });
        }
        const {
          role,
          phone,
          address,
          city,
          postalCode,
          department,
          bio,
          experience,
          siretNumber,
          preferredContactMethod,
        } = req.body;
        const profile = await storage.createProfile({
          userId,
          role,
          phone: phone || null,
          address: address || null,
          city: city || null,
          postalCode: postalCode || null,
          department: department || null,
          bio: bio || null,
          experience: experience || null,
          siretNumber: siretNumber || null,
          status: role === "marchand" ? "pending" : "approved",
          preferredContactMethod: preferredContactMethod || "email",
        });
        res.json(profile);
      } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ message: "Failed to create profile" });
      }
    },
  );

  app.patch(
    "/api/profile",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const body = req.body as Record<string, unknown>;

        if (body.notificationPrefs !== undefined) {
          const notifPrefs = body.notificationPrefs;
          if (typeof notifPrefs !== "object" || notifPrefs === null || Array.isArray(notifPrefs)) {
            return res.status(400).json({ message: "notificationPrefs must be an object" });
          }
          const allowedKeys = new Set<string>(NOTIF_PREF_KEYS);
          for (const [key, val] of Object.entries(notifPrefs as Record<string, unknown>)) {
            if (!allowedKeys.has(key)) {
              return res.status(400).json({ message: `Unknown notification preference key: ${key}` });
            }
            if (typeof val !== "boolean") {
              return res.status(400).json({ message: `Notification preference value for '${key}' must be a boolean` });
            }
          }
        }

        const profile = await storage.updateProfile(userId, body);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        res.json(profile);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  app.get(
    "/api/requests",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile) {
          return res.status(400).json({ message: "Profile required" });
        }
        const result = await storage.getRequests(userId, profile.role);
        res.json(result);
      } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
      }
    },
  );

  app.get(
    "/api/requests/available",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const result = await storage.getAvailableRequests();
        res.json(result);
      } catch (error) {
        console.error("Error fetching available requests:", error);
        res.status(500).json({ message: "Failed to fetch available requests" });
      }
    },
  );

  app.get(
    "/api/requests/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        res.json(request);
      } catch (error) {
        console.error("Error fetching request:", error);
        res.status(500).json({ message: "Failed to fetch request" });
      }
    },
  );

  app.get(
    "/api/requests/:id/contact",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });
        if (userId !== request.sellerId && userId !== request.marchantId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const otherUserId =
          userId === request.sellerId ? request.marchantId : request.sellerId;
        if (!otherUserId) return res.json(null);
        const profile = await storage.getProfile(otherUserId);
        const [userRow] = await db
          .select()
          .from(users)
          .where(eq(users.id, otherUserId));
        res.json({
          firstName: userRow?.firstName,
          lastName: userRow?.lastName,
          phone: profile?.phone,
          address: profile?.address,
          city: profile?.city,
          role: profile?.role,
        });
      } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({ message: "Failed to fetch contact" });
      }
    },
  );

  app.post(
    "/api/requests",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;

        // Role check: only sellers can create requests
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "seller") {
          return res
            .status(403)
            .json({ message: "Only sellers can create requests" });
        }

        const {
          serviceType,
          itemCount,
          estimatedValue,
          categories,
          condition,
          brands,
          meetingLocation,
          preferredDateStart,
          preferredDateEnd,
          notes,
        } = req.body;
        const request = await storage.createRequest({
          sellerId: userId,
          serviceType,
          status: "pending",
          itemCount,
          estimatedValue: estimatedValue || null,
          categories: categories || null,
          condition: condition || null,
          brands: brands || null,
          meetingLocation: meetingLocation || null,
          preferredDateStart: preferredDateStart
            ? new Date(preferredDateStart)
            : null,
          preferredDateEnd: preferredDateEnd
            ? new Date(preferredDateEnd)
            : null,
          notes: notes || null,
        });
        res.json(request);
      } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ message: "Failed to create request" });
      }
    },
  );

  app.post(
    "/api/requests/:id/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "marchand") {
          return res
            .status(403)
            .json({ message: "Only resellers can accept requests" });
        }
        if (profile.status !== "approved") {
          return res.status(403).json({ message: "Reseller must be approved" });
        }
        const id = parseInt(req.params.id);
        const request = await storage.acceptRequest(id, userId);
        if (!request) {
          return res.status(400).json({ message: "Request unavailable" });
        }

        await storage.createNotification({
          userId: request.sellerId,
          type: "request_matched",
          title: "Request Matched",
          message: "A reseller has been assigned to your request!",
          link: `/requests/${request.id}`,
        });

        res.json(request);
      } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ message: "Failed to accept request" });
      }
    },
  );

  app.get(
    "/api/requests/:id/items",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        const isParty = request.sellerId === userId || request.marchantId === userId;
        if (!isAdmin && !isParty) {
          return res.status(403).json({ message: "Not authorized to view items for this request" });
        }
        const result = await storage.getItemsByRequest(id);
        res.json(result);
      } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Failed to fetch items" });
      }
    },
  );

  app.post(
    "/api/requests/:id/items/accept-all",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const requestId = parseInt(req.params.id);

        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "seller") {
          return res.status(403).json({ message: "Only sellers can bulk-accept items" });
        }

        const request = await storage.getRequest(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.sellerId !== userId) {
          return res.status(403).json({ message: "Not authorized for this request" });
        }
        if (!request.listReadyAt) {
          return res.status(400).json({ message: "Cannot accept items before the reseller finalizes the list" });
        }

        let updated: Awaited<ReturnType<typeof storage.bulkApproveItemsTransaction>>["updatedItems"];
        try {
          ({ updatedItems: updated } = await storage.bulkApproveItemsTransaction(requestId, userId));
        } catch (txErr: any) {
          if (txErr?.message?.startsWith("CONFLICT:item:")) {
            return res.status(409).json({ message: "One or more items were modified since you loaded the page. Please refresh and try again." });
          }
          throw txErr;
        }

        if (updated.length === 0) {
          return res.status(400).json({ message: "No pending items to accept" });
        }

        if (request.marchantId) {
          await storage.createNotification({
            userId: request.marchantId,
            type: "items_bulk_approved",
            title: "All Items Approved",
            message: `The seller approved all ${updated.length} pending item(s) for request #${requestId}.`,
            link: `/requests/${requestId}`,
          });
          broadcastToUser(request.marchantId, {
            type: "items_bulk_approved",
            requestId,
            count: updated.length,
          });
        }

        if (request.listReadyAt && request.marchantId) {
          const existingAgreement = await storage.getAgreementByRequest(requestId);
          if (!existingAgreement) {
            const allItems = await storage.getItemsByRequest(requestId);
            const allApproved = allItems.length > 0 && allItems.every((i) => i.status === "approved");
            if (allApproved) {
              const { itemsSnapshot, feeBreakdown, totalValue } = await buildAgreementSnapshot(allItems);
              const agreement = await storage.createAgreement({
                requestId,
                sellerId: request.sellerId,
                marchantId: request.marchantId,
                status: "pending",
                itemCount: allItems.length,
                totalValue,
                itemsSnapshot,
                feeBreakdown,
              });
              await storage.createNotification({
                userId: request.sellerId,
                type: "agreement_ready",
                title: "Agreement Ready to Sign",
                message: `An agreement for request #${requestId} is ready for your signature.`,
                link: `/agreements/${agreement.id}`,
              });
              await storage.createNotification({
                userId: request.marchantId,
                type: "agreement_ready",
                title: "Agreement Ready to Sign",
                message: `An agreement for request #${requestId} is ready for your signature.`,
                link: `/agreements/${agreement.id}`,
              });
              broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId });
              broadcastToUser(request.marchantId, { type: "agreement_ready", agreementId: agreement.id, requestId });
              await notifyAgreementByEmail(request.sellerId, request.marchantId, requestId, agreement.id);
            }
          }
        }

        res.json({ accepted: updated.length, items: updated });
      } catch (error) {
        console.error("Error bulk-accepting items:", error);
        res.status(500).json({ message: "Failed to bulk-accept items" });
      }
    },
  );

  app.post(
    "/api/requests/:id/items",
    isAuthenticated,
    validate(createItemBody),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const requestId = parseInt(req.params.id);
        const request = await storage.getRequest(requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        // Role check: only the assigned reusse can add items
        if (request.marchantId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the assigned reseller can add items" });
        }

        // List lock check: cannot add items after finalization
        if (request.listReadyAt) {
          return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
        }

        const {
          title,
          description,
          brand,
          size,
          category,
          condition,
          minPrice,
          maxPrice,
          photos,
          certificatePhotos,
          material,
          dimensions,
          author,
          genre,
          language,
          vintage,
          ageRange,
          model,
          deviceStorage,
          ram,
          volume,
          frameSize,
          instrumentType,
          applianceType,
          decorStyle,
          subcategory,
        } = req.body;
        const item = await storage.createItem({
          requestId,
          sellerId: request.sellerId,
          marchantId: userId,
          title,
          description: description || null,
          brand: brand || null,
          size: size || null,
          category,
          condition: condition || null,
          status: "pending_approval",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          photos: photos || null,
          certificatePhotos: certificatePhotos || null,
          material: material || null,
          dimensions: dimensions || null,
          author: author || null,
          genre: genre || null,
          language: language || null,
          vintage: vintage || null,
          ageRange: ageRange || null,
          model: model || null,
          deviceStorage: deviceStorage || null,
          ram: ram || null,
          volume: volume || null,
          frameSize: frameSize || null,
          instrumentType: instrumentType || null,
          applianceType: applianceType || null,
          decorStyle: decorStyle || null,
          subcategory: subcategory || null,
        });

        await storage.createNotification({
          userId: request.sellerId,
          type: "item_added",
          title: "New Item Added",
          message: `Item "${title}" was added to your request.`,
          link: `/requests/${requestId}`,
        });

        if (minPrice || maxPrice) {
          await storage.createPriceOffer({
            itemId: item.id,
            proposedByUserId: userId,
            proposedByRole: "marchand",
            minPrice: minPrice || null,
            maxPrice: maxPrice || null,
            action: "initial",
          });
        }

        res.json(item);
      } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Failed to create item" });
      }
    },
  );

  app.get("/api/items/:id/price-history", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItemIncludingDeleted(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      const userId = req.user.id;
      if (item.sellerId !== userId && item.marchantId !== userId) {
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      const history = await storage.getPriceOffersByItem(id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  app.get("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Profile required" });
      }
      const result = await storage.getItems(userId, profile.role);
      res.json(result);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get(
    "/api/requests/:id/meetings",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = await storage.getMeetingsByRequest(id);
        res.json(result);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
      }
    },
  );

  app.post(
    "/api/requests/:id/meetings",
    isAuthenticated,
    validate(createMeetingBody),
    async (req: any, res) => {
      try {
        const requestId = parseInt(req.params.id);
        const request = await storage.getRequest(requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const { scheduledDate, location, notes, duration } = req.body;
        const meeting = await storage.createMeeting({
          requestId,
          scheduledDate: new Date(scheduledDate),
          location,
          status: "scheduled",
          notes: notes || null,
          duration: duration || 60,
        });

        await storage.updateRequest(requestId, { status: "scheduled" });

        const notifyUserId =
          req.user.id === request.sellerId
            ? request.marchantId
            : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_scheduled",
            title: "Meeting Scheduled",
            message: `A meeting has been scheduled for ${new Date(scheduledDate).toLocaleDateString("fr-FR")}.`,
            link: `/requests/${requestId}`,
          });
        }

        res.json(meeting);
      } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ message: "Failed to create meeting" });
      }
    },
  );

  app.patch(
    "/api/meetings/:meetingId/cancel",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const meetingId = parseInt(req.params.meetingId);
        const meeting = await storage.getMeeting(meetingId);
        if (!meeting) {
          return res.status(404).json({ message: "Meeting not found" });
        }
        const request = await storage.getRequest(meeting.requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const userId = req.user.id;
        if (userId !== request.sellerId && userId !== request.marchantId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const updated = await storage.updateMeeting(meetingId, {
          status: "cancelled",
        });
        const notifyUserId =
          userId === request.sellerId ? request.marchantId : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_cancelled",
            title: "Meeting Cancelled",
            message: `A meeting scheduled for ${meeting.scheduledDate ? new Date(meeting.scheduledDate).toLocaleDateString("fr-FR") : "unknown date"} has been cancelled.`,
            link: `/requests/${request.id}`,
          });
          broadcastToUser(notifyUserId, { type: "meeting_cancelled", requestId: request.id });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error cancelling meeting:", error);
        res.status(500).json({ message: "Failed to cancel meeting" });
      }
    },
  );

  app.patch(
    "/api/meetings/:meetingId/reschedule",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const meetingId = parseInt(req.params.meetingId);
        const meeting = await storage.getMeeting(meetingId);
        if (!meeting) {
          return res.status(404).json({ message: "Meeting not found" });
        }
        const request = await storage.getRequest(meeting.requestId);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }
        const userId = req.user.id;
        if (userId !== request.sellerId && userId !== request.marchantId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const { scheduledDate, location, notes } = req.body;
        if (!scheduledDate) {
          return res.status(400).json({ message: "scheduledDate is required" });
        }
        const parsedDate = new Date(scheduledDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        const updated = await storage.updateMeeting(meetingId, {
          scheduledDate: parsedDate,
          location: location || meeting.location,
          notes: notes !== undefined ? notes : meeting.notes,
          status: "scheduled",
        });
        const notifyUserId =
          userId === request.sellerId ? request.marchantId : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "meeting_rescheduled",
            title: "Meeting Rescheduled",
            message: `A meeting has been rescheduled to ${new Date(scheduledDate).toLocaleDateString("fr-FR")}.`,
            link: `/requests/${request.id}`,
          });
          broadcastToUser(notifyUserId, { type: "meeting_rescheduled", requestId: request.id, scheduledDate });
        }
        res.json(updated);
      } catch (error) {
        console.error("Error rescheduling meeting:", error);
        res.status(500).json({ message: "Failed to reschedule meeting" });
      }
    },
  );

  app.get(
    "/api/meetings",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await storage.getMeetings(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        res.status(500).json({ message: "Failed to fetch meetings" });
      }
    },
  );

  app.get(
    "/api/messages/conversations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await storage.getConversations(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Failed to fetch conversations" });
      }
    },
  );

  app.get(
    "/api/messages/:userId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        const result = await storage.getMessagesBetween(
          currentUserId,
          otherUserId,
        );
        res.json(result);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Failed to fetch messages" });
      }
    },
  );

  app.post(
    "/api/messages",
    isAuthenticated,
    validate(createMessageBody),
    async (req: any, res) => {
      try {
        const senderId = req.user.id;
        const { receiverId, content, requestId } = req.body;
        const message = await storage.createMessage({
          senderId,
          receiverId,
          content,
          requestId: requestId || null,
        });
        broadcastToUser(receiverId, { type: "new_message", message });
        broadcastToUser(senderId, { type: "new_message", message });
        res.json(message);
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  app.get(
    "/api/notifications",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const result = await storage.getNotifications(userId);
        res.json(result);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
      }
    },
  );

  app.patch(
    "/api/notifications/:id/read",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        await storage.markNotificationRead(id, userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Failed to update notification" });
      }
    },
  );

  app.patch(
    "/api/notifications/read-all",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        await storage.markAllNotificationsRead(userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all notifications read:", error);
        res.status(500).json({ message: "Failed to update notifications" });
      }
    },
  );

  app.get(
    "/api/admin/users",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getAllUsersWithProfiles();
        res.json(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    },
  );

  app.get(
    "/api/admin/applications",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getPendingReusses();
        res.json(result);
      } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    },
  );

  app.patch(
    "/api/admin/applications/:userId",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.body;
        const profile = await storage.updateProfileStatus(userId, status);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }

        await storage.createNotification({
          userId,
          type: "application_update",
          title:
            status === "approved"
              ? "Application Approved"
              : "Application Update",
          message:
            status === "approved"
              ? "Your reseller application has been approved! You can now accept seller requests."
              : "Your reseller application status has been updated.",
        });

        res.json(profile);
      } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ message: "Failed to update application" });
      }
    },
  );

  app.get(
    "/api/admin/stats",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    },
  );

  app.get("/api/admin/requests", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getAdminRequests(status);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/admin/requests/:id/flag", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const updated = await storage.updateRequest(id, { status: "flagged" });
      await storage.createNotification({ userId: request.sellerId, title: "Request Flagged", type: "moderation_flag", message: `Your request #${id} has been flagged for review.${reason ? ` Reason: ${reason}` : ""}` });
      await storage.logModerationAction({ requestId: id, adminId, action: "flag", reason });
      res.json(updated);
    } catch (error) {
      console.error("Error flagging request:", error);
      res.status(500).json({ message: "Failed to flag request" });
    }
  });

  app.post("/api/admin/requests/:id/message", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const { message } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const notification = await storage.createNotification({ userId: request.sellerId, title: "Admin Message", type: "admin_message", message: `Admin message for your request #${id}: ${message}` });
      await storage.logModerationAction({ requestId: id, adminId, action: "message", metadata: message });
      res.json(notification);
    } catch (error) {
      console.error("Error sending admin message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/admin/requests/:id/reject", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const request = await storage.getRequest(id);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const updated = await storage.updateRequest(id, { status: "cancelled" });
      await storage.createNotification({ userId: request.sellerId, title: "Request Rejected", type: "moderation_reject", message: `Your request #${id} has been rejected.${reason ? ` Reason: ${reason}` : ""}` });
      if (request.marchantId) {
        await storage.createNotification({ userId: request.marchantId, title: "Request Cancelled", type: "moderation_reject", message: `Request #${id} you were assigned to has been cancelled by an admin.` });
      }
      await storage.logModerationAction({ requestId: id, adminId, action: "reject", reason });
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  app.get("/api/admin/requests/:id/moderation", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const actions = await storage.getModerationActions(id);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching moderation history:", error);
      res.status(500).json({ message: "Failed to fetch moderation history" });
    }
  });

  app.patch(
    "/api/items/:id",
    isAuthenticated,
    validate(updateItemBody),
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const existingItem = await storage.getItem(id);
        if (!existingItem) return res.status(404).json({ message: "Item not found" });
        if (existingItem.marchantId !== userId) {
          return res.status(403).json({ message: "Only the assigned reseller can edit this item" });
        }
        if (existingItem.requestId) {
          const parentRequest = await storage.getRequest(existingItem.requestId);
          if (parentRequest?.listReadyAt) {
            return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
          }
        }
        const {
          title, description, brand, size, category, condition,
          minPrice, maxPrice, photos, certificatePhotos,
          material, dimensions, author, genre, language, vintage,
          ageRange, model, deviceStorage, ram, volume, frameSize,
          instrumentType, applianceType, decorStyle, subcategory,
        } = req.body;

        // Apply category-aware validation using existing item's category when not changing it
        const effectiveCategory = category || existingItem.category;
        const categoryIssues: z.ZodIssue[] = [];
        const collectCtx: z.RefinementCtx = { addIssue: (issue) => categoryIssues.push(issue as z.ZodIssue), path: [] };
        validateCategoryFields({ ...req.body, category: effectiveCategory }, collectCtx);
        if (categoryIssues.length > 0) {
          return res.status(400).json({ message: "Validation error", errors: categoryIssues });
        }
        const updated = await storage.updateItem(id, {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description: description || null }),
          ...(brand !== undefined && { brand: brand || null }),
          ...(size !== undefined && { size: size || null }),
          ...(category !== undefined && { category }),
          ...(condition !== undefined && { condition: condition || null }),
          ...(minPrice !== undefined && { minPrice: minPrice || null }),
          ...(maxPrice !== undefined && { maxPrice: maxPrice || null }),
          ...(photos !== undefined && { photos: photos || null }),
          ...(certificatePhotos !== undefined && { certificatePhotos: certificatePhotos || null }),
          ...(material !== undefined && { material: material || null }),
          ...(dimensions !== undefined && { dimensions: dimensions || null }),
          ...(author !== undefined && { author: author || null }),
          ...(genre !== undefined && { genre: genre || null }),
          ...(language !== undefined && { language: language || null }),
          ...(vintage !== undefined && { vintage: vintage || null }),
          ...(ageRange !== undefined && { ageRange: ageRange || null }),
          ...(model !== undefined && { model: model || null }),
          ...(deviceStorage !== undefined && { deviceStorage: deviceStorage || null }),
          ...(ram !== undefined && { ram: ram || null }),
          ...(volume !== undefined && { volume: volume || null }),
          ...(frameSize !== undefined && { frameSize: frameSize || null }),
          ...(instrumentType !== undefined && { instrumentType: instrumentType || null }),
          ...(applianceType !== undefined && { applianceType: applianceType || null }),
          ...(decorStyle !== undefined && { decorStyle: decorStyle || null }),
          ...(subcategory !== undefined && { subcategory: subcategory || null }),
        });
        if (!updated) return res.status(404).json({ message: "Item not found" });
        res.json(updated);
      } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Failed to update item" });
      }
    },
  );

  app.post(
    "/api/items/:id/approve",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        // Ownership check: only the seller can approve
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the seller can approve item pricing" });
        }

        // Optimistic locking: version is required to prevent concurrent overwrites
        const clientVersion = req.body?.version;
        if (clientVersion === undefined || clientVersion === null) {
          return res.status(400).json({ message: "Request version is required. Please refresh the page and try again." });
        }
        if (existingItem.version !== null && existingItem.version !== Number(clientVersion)) {
          return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });
        }

        // Require list to be finalized before seller can approve
        if (existingItem.requestId) {
          const parentReq = await storage.getRequest(existingItem.requestId);
          if (parentReq && !parentReq.listReadyAt) {
            return res.status(400).json({ message: "Cannot approve items before the reseller finalizes the item list" });
          }
        }

        const newData = {
          status: "approved" as const,
          priceApprovedBySeller: true,
          approvedPrice: req.body?.approvedPrice || null,
          version: (existingItem.version ?? 1) + 1,
          updatedAt: new Date(),
        };
        const item = await storage.updateItemConditional(id, Number(clientVersion), newData);
        if (!item) return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });

        await storage.createPriceOffer({
          itemId: id,
          proposedByUserId: userId,
          proposedByRole: "seller",
          minPrice: existingItem.minPrice || null,
          maxPrice: existingItem.maxPrice || null,
          action: "accepted",
        });

        if (item.marchantId) {
          await storage.createNotification({
            userId: item.marchantId,
            type: "item_approved",
            title: "Price Approved",
            message: `Seller approved pricing for "${item.title}".`,
            link: `/requests/${item.requestId}`,
          });
          broadcastToUser(item.marchantId, { type: "item_approved", itemId: item.id, itemTitle: item.title, requestId: item.requestId });
        }

        if (item.requestId && item.marchantId) {
          const request = await storage.getRequest(item.requestId);
          if (request && request.listReadyAt) {
            const existingAgreement = await storage.getAgreementByRequest(item.requestId);
            if (!existingAgreement) {
              const allItems = await storage.getItemsByRequest(item.requestId);
              const allApproved = allItems.length > 0 && allItems.every((i) => i.status === "approved");
              if (allApproved) {
                const { itemsSnapshot, feeBreakdown, totalValue } = await buildAgreementSnapshot(allItems);
                const agreement = await storage.createAgreement({
                  requestId: item.requestId,
                  sellerId: request.sellerId,
                  marchantId: item.marchantId,
                  status: "pending",
                  itemCount: allItems.length,
                  totalValue,
                  itemsSnapshot,
                  feeBreakdown,
                });
                await storage.createNotification({
                  userId: request.sellerId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                await storage.createNotification({
                  userId: item.marchantId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
                broadcastToUser(item.marchantId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
                await notifyAgreementByEmail(request.sellerId, item.marchantId, item.requestId, agreement.id);
              }
            }
          }
        }

        res.json(item);
      } catch (error: any) {
        if (error?.statusCode === 400) {
          const isFeeTierError = error.message?.includes("No fee tier");
          const message = isFeeTierError
            ? "Cannot finalize — one or more items have no applicable fee tier. Please ask the admin to configure a fee tier that covers this price range."
            : error.message;
          return res.status(400).json({ message });
        }
        console.error("Error approving item:", error);
        res.status(500).json({ message: "Failed to approve item" });
      }
    },
  );

  app.post(
    "/api/items/:id/counter-offer",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        // Ownership check: only the seller can counter-offer
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the seller can counter-offer" });
        }

        // Optimistic locking: version is required to prevent concurrent overwrites
        const counterClientVersion = req.body?.version;
        if (counterClientVersion === undefined || counterClientVersion === null) {
          return res.status(400).json({ message: "Request version is required. Please refresh the page and try again." });
        }
        if (existingItem.version !== null && existingItem.version !== Number(counterClientVersion)) {
          return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });
        }

        // Require list to be finalized before seller can counter-offer
        if (existingItem.requestId) {
          const parentReq = await storage.getRequest(existingItem.requestId);
          if (parentReq && !parentReq.listReadyAt) {
            return res.status(400).json({ message: "Cannot counter-offer before the reseller finalizes the item list" });
          }
        }

        const { minPrice, maxPrice } = req.body;
        if (!minPrice && !maxPrice) {
          return res.status(400).json({ message: "At least one of minPrice or maxPrice is required" });
        }
        const cParsedMin = minPrice ? parseFloat(minPrice) : null;
        const cParsedMax = maxPrice ? parseFloat(maxPrice) : null;
        if ((cParsedMin !== null && isNaN(cParsedMin)) || (cParsedMax !== null && isNaN(cParsedMax))) {
          return res.status(400).json({ message: "Prices must be valid numbers" });
        }
        if (cParsedMin !== null && cParsedMin <= 0) {
          return res.status(400).json({ message: "Min price must be greater than zero" });
        }
        if (cParsedMax !== null && cParsedMax <= 0) {
          return res.status(400).json({ message: "Max price must be greater than zero" });
        }
        if (cParsedMin !== null && cParsedMax !== null && cParsedMin > cParsedMax) {
          return res.status(400).json({ message: "Min price cannot be greater than max price" });
        }

        const cEffectiveMin = cParsedMin ?? (existingItem.minPrice ? parseFloat(existingItem.minPrice) : null);
        const cEffectiveMax = cParsedMax ?? (existingItem.maxPrice ? parseFloat(existingItem.maxPrice) : null);
        if (cEffectiveMin !== null && cEffectiveMax !== null) {
          const cRangeCovered = await storage.checkRangeCoveredByTiers(cEffectiveMin, cEffectiveMax);
          if (!cRangeCovered) {
            return res.status(400).json({
              message: `The proposed price range €${cEffectiveMin}–€${cEffectiveMax} is not fully covered by active fee tiers. Please propose a range within configured fee tier ranges, or ask an admin to configure one.`,
            });
          }
        } else {
          const checkPrice = cParsedMax ?? cParsedMin;
          if (checkPrice !== null) {
            const cTier = await storage.getTierForPrice(checkPrice);
            if (!cTier) {
              return res.status(400).json({
                message: `The proposed price €${checkPrice} is not covered by any active fee tier. Please propose a price within a configured fee tier range, or ask an admin to configure one.`,
              });
            }
          }
        }

        const counterNewData = {
          status: "pending_approval" as const,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          priceApprovedBySeller: false,
          sellerCounterOffer: true,
          version: (existingItem.version ?? 1) + 1,
          updatedAt: new Date(),
        };
        const item = await storage.updateItemConditional(id, Number(counterClientVersion), counterNewData);
        if (!item) return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });

        await storage.createPriceOffer({
          itemId: id,
          proposedByUserId: userId,
          proposedByRole: "seller",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          action: "counter_offer",
        });

        if (item.marchantId) {
          await storage.createNotification({
            userId: item.marchantId,
            type: "counter_offer",
            title: "Contre-offre vendeur",
            message: `Le vendeur a proposé un nouveau prix pour "${item.title}" : ${minPrice} - ${maxPrice} EUR.`,
            link: `/requests/${item.requestId}`,
          });
          broadcastToUser(item.marchantId, {
            type: "counter_offer",
            itemId: item.id,
            itemTitle: item.title,
            requestId: item.requestId,
            minPrice,
            maxPrice,
          });
        }
        res.json(item);
      } catch (error) {
        console.error("Error counter-offering:", error);
        res.status(500).json({ message: "Failed to submit counter offer" });
      }
    },
  );

  app.post(
    "/api/items/:id/decline",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
          return res
            .status(400)
            .json({ message: "A decline reason is required" });
        }
        const existingItem = await storage.getItem(id);
        if (!existingItem) return res.status(404).json({ message: "Item not found" });
        if (existingItem.sellerId !== userId) {
          return res.status(403).json({ message: "Only the seller can decline item pricing" });
        }

        const declineClientVersion = req.body?.version;
        if (declineClientVersion === undefined || declineClientVersion === null) {
          return res.status(400).json({ message: "Request version is required. Please refresh the page and try again." });
        }
        if (existingItem.version !== null && existingItem.version !== Number(declineClientVersion)) {
          return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });
        }

        const declineNewData = {
          status: "returned" as const,
          priceApprovedBySeller: false,
          declineReason: reason.trim(),
          version: (existingItem.version ?? 1) + 1,
          updatedAt: new Date(),
        };
        const item = await storage.updateItemConditional(id, Number(declineClientVersion), declineNewData);
        if (!item) return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });

        if (item.marchantId) {
          await storage.createNotification({
            userId: item.marchantId,
            type: "item_declined",
            title: "Article refusé",
            message: `Le vendeur a refusé "${item.title}". Raison : ${reason.trim()}`,
            link: `/requests/${item.requestId}`,
          });
          broadcastToUser(item.marchantId, { type: "item_declined", itemId: item.id, itemTitle: item.title, requestId: item.requestId });
        }
        res.json(item);
      } catch (error) {
        console.error("Error declining item:", error);
        res.status(500).json({ message: "Failed to decline item" });
      }
    },
  );

  app.post(
    "/api/items/:id/accept-counter-offer",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        const existingItem = await storage.getItem(id);
        if (!existingItem) return res.status(404).json({ message: "Item not found" });
        if (existingItem.marchantId !== userId) {
          return res.status(403).json({ message: "Only the assigned reseller can accept a counter-offer" });
        }
        if (!existingItem.sellerCounterOffer) {
          return res.status(400).json({ message: "No pending seller counter-offer on this item" });
        }
        if (existingItem.status !== "pending_approval") {
          return res.status(400).json({ message: "Item is not in a negotiation state" });
        }
        if (existingItem.requestId) {
          const parentReq = await storage.getRequest(existingItem.requestId);
          if (!parentReq || !parentReq.listReadyAt) {
            return res.status(400).json({ message: "Cannot accept counter-offer before the item list is finalized" });
          }
        }

        // Accept the seller's proposed price range — use their maxPrice as the approved price
        const approvedPrice = existingItem.maxPrice || existingItem.minPrice || null;

        const acceptClientVersion = req.body?.version;
        if (acceptClientVersion === undefined || acceptClientVersion === null) {
          return res.status(400).json({ message: "Request version is required. Please refresh the page and try again." });
        }
        if (existingItem.version !== null && existingItem.version !== Number(acceptClientVersion)) {
          return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });
        }

        const acceptNewData = {
          status: "approved" as const,
          priceApprovedBySeller: true,
          sellerCounterOffer: false,
          approvedPrice,
          version: (existingItem.version ?? 1) + 1,
          updatedAt: new Date(),
        };
        const item = await storage.updateItemConditional(id, Number(acceptClientVersion), acceptNewData);
        if (!item) return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });

        await storage.createPriceOffer({
          itemId: id,
          proposedByUserId: userId,
          proposedByRole: "marchand",
          minPrice: existingItem.minPrice || null,
          maxPrice: existingItem.maxPrice || null,
          action: "accepted",
        });

        if (existingItem.sellerId) {
          await storage.createNotification({
            userId: existingItem.sellerId,
            type: "counter_offer_accepted",
            title: "Counter-offer Accepted",
            message: `The reseller accepted your proposed price for "${existingItem.title}".`,
            link: `/requests/${existingItem.requestId}`,
          });
          broadcastToUser(existingItem.sellerId, { type: "item_approved", itemId: id, itemTitle: existingItem.title, requestId: existingItem.requestId });
        }

        // Trigger agreement generation if all items are now approved
        if (item.requestId && item.marchantId) {
          const request = await storage.getRequest(item.requestId);
          if (request && request.listReadyAt) {
            const existingAgreement = await storage.getAgreementByRequest(item.requestId);
            if (!existingAgreement) {
              const allItems = await storage.getItemsByRequest(item.requestId);
              const allApproved = allItems.length > 0 && allItems.every((i) => i.status === "approved");
              if (allApproved) {
                const { itemsSnapshot, feeBreakdown, totalValue } = await buildAgreementSnapshot(allItems);
                const agreement = await storage.createAgreement({
                  requestId: item.requestId,
                  sellerId: request.sellerId,
                  marchantId: item.marchantId,
                  status: "pending",
                  itemCount: allItems.length,
                  totalValue,
                  itemsSnapshot,
                  feeBreakdown,
                });
                await storage.createNotification({
                  userId: request.sellerId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                await storage.createNotification({
                  userId: item.marchantId,
                  type: "agreement_ready",
                  title: "Agreement Ready to Sign",
                  message: `An agreement for request #${item.requestId} is ready for your signature.`,
                  link: `/agreements/${agreement.id}`,
                });
                broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
                broadcastToUser(item.marchantId, { type: "agreement_ready", agreementId: agreement.id, requestId: item.requestId });
                await notifyAgreementByEmail(request.sellerId, item.marchantId, item.requestId, agreement.id);
              }
            }
          }
        }

        res.json(item);
      } catch (error: any) {
        if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
        console.error("Error accepting counter-offer:", error);
        res.status(500).json({ message: "Failed to accept counter-offer" });
      }
    },
  );

  app.post(
    "/api/items/:id/revise-price",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        const existingItem = await storage.getItem(id);
        if (!existingItem) return res.status(404).json({ message: "Item not found" });
        if (existingItem.marchantId !== userId) {
          return res.status(403).json({ message: "Only the assigned reseller can revise the price" });
        }

        // Guard: only allowed when item is in active negotiation and no agreement exists yet
        if (existingItem.status !== "pending_approval") {
          return res.status(400).json({ message: "Can only revise price on items that are pending approval" });
        }
        if (!existingItem.sellerCounterOffer) {
          return res.status(400).json({ message: "Can only revise price in response to a seller counter-offer" });
        }
        if (existingItem.requestId) {
          const parentReq = await storage.getRequest(existingItem.requestId);
          if (!parentReq || !parentReq.listReadyAt) {
            return res.status(400).json({ message: "Cannot revise price before the item list is finalized" });
          }
          const existingAgreement = await storage.getAgreementByRequest(existingItem.requestId);
          if (existingAgreement) {
            return res.status(409).json({ message: "An agreement already exists for this request — price revision is no longer allowed" });
          }
        }

        const { minPrice, maxPrice } = req.body;
        if (!minPrice && !maxPrice) {
          return res.status(400).json({ message: "At least one of minPrice or maxPrice is required" });
        }
        const parsedMin = minPrice ? parseFloat(minPrice) : null;
        const parsedMax = maxPrice ? parseFloat(maxPrice) : null;
        if ((parsedMin !== null && isNaN(parsedMin)) || (parsedMax !== null && isNaN(parsedMax))) {
          return res.status(400).json({ message: "Prices must be valid numbers" });
        }
        if (parsedMin !== null && parsedMin <= 0) {
          return res.status(400).json({ message: "Min price must be greater than zero" });
        }
        if (parsedMax !== null && parsedMax <= 0) {
          return res.status(400).json({ message: "Max price must be greater than zero" });
        }
        if (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax) {
          return res.status(400).json({ message: "Min price cannot be greater than max price" });
        }

        const reviseClientVersion = req.body?.version;
        if (reviseClientVersion === undefined || reviseClientVersion === null) {
          return res.status(400).json({ message: "Request version is required. Please refresh the page and try again." });
        }
        if (existingItem.version !== null && existingItem.version !== Number(reviseClientVersion)) {
          return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });
        }

        const rEffectiveMin = parsedMin ?? (existingItem.minPrice ? parseFloat(existingItem.minPrice) : null);
        const rEffectiveMax = parsedMax ?? (existingItem.maxPrice ? parseFloat(existingItem.maxPrice) : null);
        if (rEffectiveMin !== null && rEffectiveMax !== null) {
          const rRangeCovered = await storage.checkRangeCoveredByTiers(rEffectiveMin, rEffectiveMax);
          if (!rRangeCovered) {
            return res.status(400).json({
              message: `The proposed price range €${rEffectiveMin}–€${rEffectiveMax} is not fully covered by active fee tiers. Please propose a range within configured fee tier ranges, or ask an admin to configure one.`,
            });
          }
        } else {
          const checkPrice = parsedMax ?? parsedMin;
          if (checkPrice !== null) {
            const rTier = await storage.getTierForPrice(checkPrice);
            if (!rTier) {
              return res.status(400).json({
                message: `The proposed price €${checkPrice} is not covered by any active fee tier. Please propose a price within a configured fee tier range, or ask an admin to configure one.`,
              });
            }
          }
        }

        const reviseNewData = {
          status: "pending_approval" as const,
          minPrice: minPrice || existingItem.minPrice,
          maxPrice: maxPrice || existingItem.maxPrice,
          priceApprovedBySeller: false,
          sellerCounterOffer: false,
          approvedPrice: null,
          version: (existingItem.version ?? 1) + 1,
          updatedAt: new Date(),
        };
        const item = await storage.updateItemConditional(id, Number(reviseClientVersion), reviseNewData);
        if (!item) return res.status(409).json({ message: "This item was modified by another action. Please refresh and try again." });

        await storage.createPriceOffer({
          itemId: id,
          proposedByUserId: userId,
          proposedByRole: "marchand",
          minPrice: minPrice || existingItem.minPrice || null,
          maxPrice: maxPrice || existingItem.maxPrice || null,
          action: "revision",
        });

        if (existingItem.sellerId) {
          const revisedMin = minPrice || existingItem.minPrice;
          const revisedMax = maxPrice || existingItem.maxPrice;
          await storage.createNotification({
            userId: existingItem.sellerId,
            type: "price_revised",
            title: "Price Range Revised",
            message: `The reseller has revised the price range for "${existingItem.title}": ${revisedMin} – ${revisedMax} EUR. Please review and respond.`,
            link: `/requests/${existingItem.requestId}`,
          });
          broadcastToUser(existingItem.sellerId, {
            type: "price_revised",
            itemId: existingItem.id,
            itemTitle: existingItem.title,
            requestId: existingItem.requestId,
            minPrice: revisedMin,
            maxPrice: revisedMax,
          });
        }

        res.json(item);
      } catch (error) {
        console.error("Error revising price:", error);
        res.status(500).json({ message: "Failed to revise price" });
      }
    },
  );

  app.post(
    "/api/items/:id/duplicate",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const original = await storage.getItem(id);
        if (!original)
          return res.status(404).json({ message: "Item not found" });
        if (original.marchantId !== userId)
          return res.status(403).json({ message: "Not authorized" });
        if (original.requestId) {
          const parentRequest = await storage.getRequest(original.requestId);
          if (parentRequest?.listReadyAt) {
            return res.status(400).json({ message: "Item list is finalized and locked — no further changes allowed" });
          }
        }

        const duplicate = await storage.createItem({
          requestId: original.requestId || undefined,
          sellerId: original.sellerId,
          marchantId: original.marchantId || undefined,
          title: original.title,
          description: original.description || undefined,
          brand: original.brand || undefined,
          size: original.size || undefined,
          category: original.category,
          condition: original.condition || undefined,
          photos: original.photos || undefined,
          certificatePhotos: original.certificatePhotos || undefined,
          material: original.material || undefined,
          dimensions: original.dimensions || undefined,
          author: original.author || undefined,
          genre: original.genre || undefined,
          language: original.language || undefined,
          vintage: original.vintage || undefined,
          ageRange: original.ageRange || undefined,
          model: original.model || undefined,
          deviceStorage: original.deviceStorage || undefined,
          ram: original.ram || undefined,
          volume: original.volume || undefined,
          frameSize: original.frameSize || undefined,
          instrumentType: original.instrumentType || undefined,
          applianceType: original.applianceType || undefined,
          decorStyle: original.decorStyle || undefined,
          subcategory: original.subcategory || undefined,
          minPrice: original.minPrice || undefined,
          maxPrice: original.maxPrice || undefined,
          status: "pending_approval",
        });
        res.json(duplicate);
      } catch (error) {
        console.error("Error duplicating item:", error);
        res.status(500).json({ message: "Failed to duplicate item" });
      }
    },
  );

  app.post(
    "/api/items/:id/list",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        // Ownership check: only the assigned reusse can list
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.marchantId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the assigned reseller can list items" });
        }

        const { platformListedOn } = req.body;
        const item = await storage.updateItem(id, {
          status: "listed",
          listedAt: new Date(),
          platformListedOn: platformListedOn || null,
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        if (item.sellerId) {
          await storage.createNotification({
            userId: item.sellerId,
            type: "item_listed",
            title: "Item Listed",
            message: `"${item.title}" has been listed${platformListedOn ? ` on ${platformListedOn}` : ""}.`,
            link: `/requests/${item.requestId}`,
          });
        }

        if (item.requestId) {
          await storage.updateRequest(item.requestId, {
            status: "in_progress",
          });
        }

        res.json(item);
      } catch (error) {
        console.error("Error listing item:", error);
        res.status(500).json({ message: "Failed to list item" });
      }
    },
  );

  app.post(
    "/api/items/:id/mark-sold",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        // Ownership check: only the assigned reusse can mark as sold
        const existingItem = await storage.getItem(id);
        if (!existingItem)
          return res.status(404).json({ message: "Item not found" });
        if (existingItem.marchantId !== userId) {
          return res
            .status(403)
            .json({
              message: "Only the assigned reseller can mark items as sold",
            });
        }

        const { salePrice } = req.body;
        if (!salePrice || parseFloat(salePrice) <= 0) {
          return res.status(400).json({ message: "Valid sale price required" });
        }

        const salePriceNum = parseFloat(salePrice);

        // Resolve fee tier BEFORE mutating item state — if no tier covers this
        // price the route returns 400 and the item is left untouched.
        const feeRes = await resolveFeePercentages(salePriceNum);
        const sellerAmt = parseFloat(((salePriceNum * feeRes.sellerPct) / 100).toFixed(2));
        const marchantAmt = parseFloat(((salePriceNum * feeRes.marchantPct) / 100).toFixed(2));
        const platformAmt = parseFloat((salePriceNum - sellerAmt - marchantAmt).toFixed(2));

        const item = await storage.updateItem(id, {
          status: "sold",
          salePrice: salePrice.toString(),
          soldAt: new Date(),
          updatedAt: new Date(),
        });
        if (!item) return res.status(404).json({ message: "Item not found" });

        // Check if a signed agreement already has a transaction for this item.
        // If so, update that transaction with the actual sale price + live tier snapshot.
        // Otherwise create a new transaction.
        let transaction: Transaction | null = null;
        const existingTxn = await storage.getTransactionByItemId(id);
        if (existingTxn) {
          transaction = (await storage.updateTransaction(existingTxn.id, {
            salePrice: salePrice.toString(),
            sellerEarning: sellerAmt.toString(),
            marchantEarning: marchantAmt.toString(),
            platformEarning: platformAmt.toString(),
            feeTierId: feeRes.tierId,
            sellerPercent: feeRes.sellerPct.toString(),
            marchantPercent: feeRes.marchantPct.toString(),
            platformPercent: feeRes.platformPct.toString(),
            status: "completed",
          })) ?? null;
        } else {
          transaction = await storage.createTransaction({
            itemId: item.id,
            requestId: item.requestId || null,
            sellerId: item.sellerId,
            marchantId: item.marchantId || req.user.id,
            salePrice: salePrice.toString(),
            sellerEarning: sellerAmt.toString(),
            marchantEarning: marchantAmt.toString(),
            platformEarning: platformAmt.toString(),
            feeTierId: feeRes.tierId,
            sellerPercent: feeRes.sellerPct.toString(),
            marchantPercent: feeRes.marchantPct.toString(),
            platformPercent: feeRes.platformPct.toString(),
            status: "completed",
          });
        }

        const sellerEarning = transaction ? transaction.sellerEarning : sellerAmt.toFixed(2);

        await storage.createNotification({
          userId: item.sellerId,
          type: "item_sold",
          title: "Item Sold!",
          message: `"${item.title}" sold for ${salePrice} EUR. Your earnings: ${sellerEarning} EUR.`,
          link: `/items`,
        });

        res.json({ item, transaction });
      } catch (error: any) {
        if (error?.statusCode === 400) {
          return res.status(400).json({ message: error.message });
        }
        console.error("Error marking item sold:", error);
        res.status(500).json({ message: "Failed to mark item as sold" });
      }
    },
  );

  app.patch(
    "/api/requests/:id/cancel",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });

        // Ownership check: only the seller (request owner) can cancel
        if (request.sellerId !== userId) {
          return res
            .status(403)
            .json({ message: "Only the request owner can cancel" });
        }

        const updated = await storage.updateRequest(id, {
          status: "cancelled",
        });

        if (request.marchantId) {
          await storage.createNotification({
            userId: request.marchantId,
            type: "request_cancelled",
            title: "Request Cancelled",
            message: `Request #${id} has been cancelled.`,
            link: `/requests/${id}`,
          });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error cancelling request:", error);
        res.status(500).json({ message: "Failed to cancel request" });
      }
    },
  );

  app.patch(
    "/api/requests/:id/complete",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });

        // Ownership check: only seller or assigned reusse can complete
        if (request.sellerId !== userId && request.marchantId !== userId) {
          return res
            .status(403)
            .json({
              message:
                "Only the seller or assigned reseller can complete this request",
            });
        }

        const updated = await storage.updateRequest(id, {
          status: "completed",
          completedAt: new Date(),
        });

        const notifyUserId =
          req.user.id === request.sellerId
            ? request.marchantId
            : request.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "request_completed",
            title: "Request Completed",
            message: `Request #${id} has been marked as complete.`,
            link: `/requests/${id}`,
          });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error completing request:", error);
        res.status(500).json({ message: "Failed to complete request" });
      }
    },
  );

  app.get(
    "/api/earnings",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile)
          return res.status(400).json({ message: "Profile required" });
        const earnings = await storage.getEarnings(userId, profile.role);
        res.json(earnings);
      } catch (error) {
        console.error("Error fetching earnings:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
      }
    },
  );

  app.get(
    "/api/earnings-summary",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });
        const summary = await storage.getEarningsSummary(userId, profile.role);
        res.json(summary);
      } catch (error) {
        console.error("Error fetching earnings summary:", error);
        res.status(500).json({ message: "Failed to fetch earnings summary" });
      }
    },
  );

  app.get(
    "/api/stats/activity",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });
        const stats = await storage.getActivityStats(userId, profile.role);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        res.status(500).json({ message: "Failed to fetch activity stats" });
      }
    },
  );

  app.get(
    "/api/marchands",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const marchands = await storage.getResellers();
        res.json(marchands);
      } catch (error) {
        console.error("Error fetching marchands:", error);
        res.status(500).json({ message: "Failed to fetch marchands" });
      }
    },
  );

  app.get(
    "/api/marchands/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const marchand = await storage.getResellerById(req.params.id);
        if (!marchand) return res.status(404).json({ message: "Marchand not found" });
        res.json(marchand);
      } catch (error) {
        console.error("Error fetching marchand:", error);
        res.status(500).json({ message: "Failed to fetch marchand" });
      }
    },
  );

  app.get(
    "/api/marchands/:id/reviews",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const revs = await storage.getReviews(req.params.id);
        res.json(revs);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
      }
    },
  );

  app.post(
    "/api/requests/:id/review",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "seller")
          return res.status(403).json({ message: "Only sellers can leave reviews" });
        const request = await storage.getRequest(id);
        if (!request || request.sellerId !== userId)
          return res.status(403).json({ message: "Not your request" });
        if (request.status !== "completed")
          return res.status(400).json({ message: "Request must be completed to review" });
        if (!request.marchantId)
          return res.status(400).json({ message: "No reseller assigned" });
        const schema = z.object({
          rating: z.number().int().min(1).max(5),
          comment: z.string().optional(),
          communicationRating: z.number().int().min(1).max(5).optional(),
          reliabilityRating: z.number().int().min(1).max(5).optional(),
          handlingRating: z.number().int().min(1).max(5).optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
          return res.status(400).json({ message: "Invalid review data" });
        const review = await storage.createReview({
          requestId: id,
          sellerId: userId,
          marchantId: request.marchantId,
          ...parsed.data,
        });
        await storage.createNotification({
          userId: request.marchantId,
          type: "review_received",
          title: "Avis reçu",
          message: `Un vendeur a laissé un avis ${parsed.data.rating}/5 pour la demande #${id}.`,
          link: `/requests/${id}`,
        });
        res.json(review);
      } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Failed to create review" });
      }
    },
  );

  app.get(
    "/api/items/:id/documents",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.marchantId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const docs = await storage.getItemDocuments(itemId);
        res.json(docs.map(({ fileUrl: _omit, ...rest }) => rest));
      } catch (error) {
        console.error("Error fetching item documents:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
      }
    },
  );

  app.post(
    "/api/items/:id/documents",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.marchantId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|pdf)$/i;
        const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
        const MAX_CERT_SIZE = 5 * 1024 * 1024;

        const schema = z.object({
          fileName: z.string().min(1).refine(
            (name) => ALLOWED_EXTENSIONS.test(name),
            { message: "Only image files (JPG, PNG, WebP, GIF) and PDFs are allowed" }
          ),
          fileUrl: z.string().min(1),
          fileType: z.enum(["photo", "certificate"]),
          fileSize: z.number().positive({ message: "fileSize is required and must be a positive number" }),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid document data", errors: parsed.error.errors });
        }
        const { fileSize, fileType, fileName } = parsed.data;
        if (fileType === "photo" && /\.pdf$/i.test(fileName)) {
          return res.status(400).json({ message: "PDF files cannot be uploaded as photos. Select 'Certificate' type for PDFs." });
        }
        const maxSize = fileType === "photo" ? MAX_PHOTO_SIZE : MAX_CERT_SIZE;
        if (fileSize > maxSize) {
          const limitMB = maxSize / (1024 * 1024);
          return res.status(400).json({ message: `File too large. ${fileType === "photo" ? "Photos" : "Documents"} must be under ${limitMB}MB.` });
        }
        if (!parsed.data.fileUrl.startsWith("/objects/")) {
          return res.status(400).json({ message: "Invalid file URL: must be an uploaded object path" });
        }

        const existingDocs = await storage.getItemDocuments(itemId);
        const MAX_PHOTOS_PER_ITEM = 5;
        const MAX_CERTS_PER_ITEM = 3;
        if (parsed.data.fileType === "photo") {
          const photoCount = existingDocs.filter((d) => d.fileType === "photo").length;
          if (photoCount >= MAX_PHOTOS_PER_ITEM) {
            return res.status(400).json({ message: `Maximum of ${MAX_PHOTOS_PER_ITEM} photos allowed per item.` });
          }
        } else {
          const certCount = existingDocs.filter((d) => d.fileType === "certificate").length;
          if (certCount >= MAX_CERTS_PER_ITEM) {
            return res.status(400).json({ message: `Maximum of ${MAX_CERTS_PER_ITEM} certificates allowed per item.` });
          }
        }

        const doc = await storage.createItemDocument({
          itemId,
          uploaderUserId: userId,
          fileName: parsed.data.fileName,
          fileUrl: parsed.data.fileUrl,
          fileType: parsed.data.fileType,
          fileSize: parsed.data.fileSize || null,
        });

        const notifyUserId = userId === item.sellerId ? item.marchantId : item.sellerId;
        if (notifyUserId) {
          await storage.createNotification({
            userId: notifyUserId,
            type: "new_document",
            title: "New Document Uploaded",
            message: `A new document "${parsed.data.fileName}" was uploaded for item "${item.title}".`,
            link: `/requests/${item.requestId}`,
          });
          broadcastToUser(notifyUserId, {
            type: "new_document",
            itemId,
            fileName: parsed.data.fileName,
            itemTitle: item.title,
          });
        }

        res.json(doc);
      } catch (error) {
        console.error("Error creating item document:", error);
        res.status(500).json({ message: "Failed to save document" });
      }
    },
  );

  app.post(
    "/api/items/:id/document-request",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "marchand") {
          return res.status(403).json({ message: "Only resellers can request documents" });
        }
        if (item.marchantId !== userId) {
          return res.status(403).json({ message: "Not assigned to this item" });
        }
        const existing = await storage.getDocumentRequestStatus(itemId, userId);
        if (existing) {
          return res.status(409).json({ message: "Document request already sent for this item", alreadyRequested: true });
        }
        try {
          await storage.createDocumentRequest(itemId, userId);
        } catch (err: any) {
          if (err?.code === "23505") {
            return res.status(409).json({ message: "Document request already sent for this item", alreadyRequested: true });
          }
          throw err;
        }
        const content = `📄 I'd like to request additional documentation for "${item.title}". Please upload authenticity certificates, purchase receipts, or any relevant documents.`;
        const message = await storage.createMessage({
          senderId: userId,
          receiverId: item.sellerId,
          content,
          requestId: item.requestId || null,
        });
        broadcastToUser(item.sellerId, { type: "new_message", message });
        broadcastToUser(userId, { type: "new_message", message });
        await storage.createNotification({
          userId: item.sellerId,
          type: "document_request",
          title: "Document Request",
          message: `Your reseller is requesting additional documentation for "${item.title}".`,
          link: item.requestId ? `/requests/${item.requestId}` : `/items`,
        });
        broadcastToUser(item.sellerId, {
          type: "document_request",
          itemId,
          itemTitle: item.title,
          requestId: item.requestId,
        });
        res.json({ success: true, message });
      } catch (error) {
        console.error("Error sending document request:", error);
        res.status(500).json({ message: "Failed to send document request" });
      }
    },
  );

  app.get(
    "/api/items/:id/document-request-status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.marchantId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const requestUserId = profile?.role === "marchand" ? userId : item.marchantId;
        const existing = requestUserId
          ? await storage.getDocumentRequestStatus(itemId, requestUserId)
          : null;
        res.json({ requested: !!existing, requestedAt: existing?.createdAt || null });
      } catch (error) {
        console.error("Error checking document request status:", error);
        res.status(500).json({ message: "Failed to check status" });
      }
    },
  );

  app.get(
    "/api/items/:id/documents/:docId/download",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const docId = parseInt(req.params.docId);
        const item = await storage.getItem(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && item.sellerId !== userId && item.marchantId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        const doc = await storage.getItemDocument(docId);
        if (!doc || doc.itemId !== itemId) {
          return res.status(404).json({ message: "Document not found" });
        }
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(doc.fileUrl);
        await objectStorageService.downloadObject(objectFile, res, 0);
      } catch (error: any) {
        const isNotFound =
          error?.code === "NOT_FOUND" ||
          error?.message?.toLowerCase().includes("not found") ||
          error?.message?.toLowerCase().includes("no such object") ||
          error?.statusCode === 404;
        if (isNotFound) {
          return res.status(404).json({ message: "Document file not found in storage" });
        }
        console.error("Error serving document:", error);
        res.status(500).json({ message: "Failed to serve document" });
      }
    },
  );

  app.get(
    "/api/documents",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const docs = await storage.getDocumentsByUser(userId);
        res.json(docs.map(({ fileUrl: _omit, ...rest }) => rest));
      } catch (error) {
        console.error("Error fetching user documents:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
      }
    },
  );

  app.get(
    "/api/user/agreements",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const userAgreements = await storage.getUserAgreements(userId);
        res.json(userAgreements);
      } catch (error) {
        console.error("Error fetching user agreements:", error);
        res.status(500).json({ message: "Failed to fetch agreements" });
      }
    },
  );

  app.delete(
    "/api/items/:id/documents/:docId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const itemId = parseInt(req.params.id);
        const docId = parseInt(req.params.docId);
        const doc = await storage.getItemDocument(docId);
        if (!doc || doc.itemId !== itemId) {
          return res.status(404).json({ message: "Document not found" });
        }
        const profile = await storage.getProfile(userId);
        const isAdmin = profile?.role === "admin";
        if (!isAdmin && doc.uploaderUserId !== userId) {
          return res.status(403).json({ message: "Not authorized to delete this document" });
        }
        await storage.deleteItemDocument(docId);
        res.json({ message: "Document deleted" });
      } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ message: "Failed to delete document" });
      }
    },
  );

  app.post(
    "/api/requests/:id/finalize-list",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "marchand") {
          return res.status(403).json({ message: "Only resellers can finalize the item list" });
        }
        const request = await storage.getRequest(id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.marchantId !== userId) return res.status(403).json({ message: "Not assigned to this request" });
        if (request.listReadyAt) return res.status(409).json({ message: "List already finalized" });

        const existingItems = await storage.getItemsByRequest(id);
        if (existingItems.length === 0) {
          return res.status(400).json({ message: "Cannot finalize an empty item list" });
        }

        const updated = await storage.updateRequest(id, { listReadyAt: new Date() });

        await storage.createNotification({
          userId: request.sellerId,
          type: "list_finalized",
          title: "Item List Finalized",
          message: `The reseller has finalized the item list for request #${id}. Please review and approve all items.`,
          link: `/requests/${id}`,
        });

        const items = await storage.getItemsByRequest(id);
        const allApproved = items.length > 0 && items.every((i) => i.status === "approved");
        if (allApproved) {
          const existingAgreement = await storage.getAgreementByRequest(id);
          if (!existingAgreement) {
            const { itemsSnapshot, feeBreakdown, totalValue } = await buildAgreementSnapshot(items);
            const agreement = await storage.createAgreement({
              requestId: id,
              sellerId: request.sellerId,
              marchantId: userId,
              status: "pending",
              itemCount: items.length,
              totalValue,
              itemsSnapshot,
              feeBreakdown,
            });
            await storage.createNotification({
              userId: request.sellerId,
              type: "agreement_ready",
              title: "Agreement Ready to Sign",
              message: `An agreement for request #${id} is ready for your signature.`,
              link: `/agreements/${agreement.id}`,
            });
            await storage.createNotification({
              userId,
              type: "agreement_ready",
              title: "Agreement Ready to Sign",
              message: `An agreement for request #${id} is ready for your signature.`,
              link: `/agreements/${agreement.id}`,
            });
            broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId: id });
            broadcastToUser(userId, { type: "agreement_ready", agreementId: agreement.id, requestId: id });
            await notifyAgreementByEmail(request.sellerId, userId, id, agreement.id);
          }
        }

        res.json(updated);
      } catch (error: any) {
        if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
        console.error("Error finalizing list:", error);
        res.status(500).json({ message: "Failed to finalize list" });
      }
    },
  );

  app.get(
    "/api/requests/:id/agreement",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const request = await storage.getRequest(id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        const isAdmin = profile?.role === "admin";
        const isParticipant = request.sellerId === userId || request.marchantId === userId;
        if (!isAdmin && !isParticipant) {
          return res.status(403).json({ message: "Not authorized to view this agreement" });
        }
        const agreement = await storage.getAgreementByRequest(id);
        if (!agreement) return res.json(null);
        res.json(agreement);
      } catch (error) {
        console.error("Error fetching agreement:", error);
        res.status(500).json({ message: "Failed to fetch agreement" });
      }
    },
  );

  app.post(
    "/api/requests/:id/generate-agreement",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const requestId = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const request = await storage.getRequest(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });
        const isAdmin = profile?.role === "admin";
        const isParticipant = request.sellerId === userId || request.marchantId === userId;
        if (!isAdmin && !isParticipant) {
          return res.status(403).json({ message: "Not authorized" });
        }
        if (!request.listReadyAt) {
          return res.status(400).json({ message: "Item list not yet finalized" });
        }
        if (!request.marchantId) {
          return res.status(400).json({ message: "No reseller assigned" });
        }
        const existing = await storage.getAgreementByRequest(requestId);
        if (existing) return res.json(existing);
        const items = await storage.getItemsByRequest(requestId);
        if (items.length === 0) {
          return res.status(400).json({ message: "No items found for this request" });
        }
        const allApproved = items.every((i) => i.status === "approved");
        if (!allApproved) {
          return res.status(400).json({ message: "Not all items are approved yet" });
        }
        const { itemsSnapshot, feeBreakdown, totalValue } = await buildAgreementSnapshot(items);
        const agreement = await storage.createAgreement({
          requestId,
          sellerId: request.sellerId,
          marchantId: request.marchantId,
          status: "pending",
          itemCount: items.length,
          totalValue,
          itemsSnapshot,
          feeBreakdown,
        });
        await storage.createNotification({
          userId: request.sellerId,
          type: "agreement_ready",
          title: "Agreement Ready to Sign",
          message: `An agreement for request #${requestId} is ready for your signature.`,
          link: `/agreements/${agreement.id}`,
        });
        await storage.createNotification({
          userId: request.marchantId,
          type: "agreement_ready",
          title: "Agreement Ready to Sign",
          message: `An agreement for request #${requestId} is ready for your signature.`,
          link: `/agreements/${agreement.id}`,
        });
        broadcastToUser(request.sellerId, { type: "agreement_ready", agreementId: agreement.id, requestId });
        broadcastToUser(request.marchantId, { type: "agreement_ready", agreementId: agreement.id, requestId });
        await notifyAgreementByEmail(request.sellerId, request.marchantId, requestId, agreement.id);
        res.json(agreement);
      } catch (error: any) {
        if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
        console.error("Error generating agreement:", error);
        res.status(500).json({ message: "Failed to generate agreement" });
      }
    },
  );

  app.get(
    "/api/agreements/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        const agreement = await storage.getAgreementWithDetails(id);
        if (!agreement) return res.status(404).json({ message: "Agreement not found" });
        if (profile?.role !== "admin" && agreement.sellerId !== userId && agreement.marchantId !== userId) {
          return res.status(403).json({ message: "Not authorized" });
        }
        res.json(agreement);
      } catch (error) {
        console.error("Error fetching agreement:", error);
        res.status(500).json({ message: "Failed to fetch agreement" });
      }
    },
  );

  app.post(
    "/api/agreements/:id/sign",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });

        const { agreed } = req.body;
        if (agreed !== true) {
          return res.status(400).json({ message: "You must agree to sign this agreement (agreed: true)" });
        }

        const agreement = await storage.getAgreement(id);
        if (!agreement) return res.status(404).json({ message: "Agreement not found" });

        if (agreement.sellerId !== userId && agreement.marchantId !== userId) {
          return res.status(403).json({ message: "Not a party to this agreement" });
        }

        const existingSig = await storage.getAgreementSignature(id, userId);
        if (existingSig) return res.status(409).json({ message: "Already signed this agreement" });

        const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
        const role = agreement.sellerId === userId ? "seller" : "marchand";

        await storage.createAgreementSignature({ agreementId: id, userId, role, ipAddress });

        const allSigs = await storage.getAgreementSignatures(id);
        const hasSeller = allSigs.some((s) => s.userId === agreement.sellerId);
        const hasMarchand = allSigs.some((s) => s.userId === agreement.marchantId);

        let newStatus = agreement.status;
        if (hasSeller && hasMarchand) {
          newStatus = "fully_signed";
        } else if (hasSeller) {
          newStatus = "seller_signed";
        } else if (hasMarchand) {
          newStatus = "marchand_signed";
        }

        await storage.updateAgreementStatus(id, newStatus);

        const otherUserId = agreement.sellerId === userId ? agreement.marchantId : agreement.sellerId;
        await storage.createNotification({
          userId: otherUserId,
          type: "agreement_signed",
          title: newStatus === "fully_signed" ? "Agreement Fully Signed" : "Agreement Partially Signed",
          message: newStatus === "fully_signed"
            ? `Agreement for request #${agreement.requestId} has been fully signed by both parties.`
            : `${profile.role === "seller" ? "The seller" : "The reseller"} has signed the agreement for request #${agreement.requestId}.`,
          link: `/agreements/${id}`,
        });

        if (newStatus === "fully_signed") {
          const requestItems = await storage.getItemsByRequest(agreement.requestId);
          const parsedItems = JSON.parse(agreement.itemsSnapshot);
          for (const snapItem of parsedItems) {
            const price = snapItem.approvedPrice;
            const matchingItem = requestItems.find((i) => i.id === snapItem.id);
            if (matchingItem) {
              const existingTxn = await storage.getTransactionByItemId(matchingItem.id);
              if (!existingTxn) {
                const feeRes = await resolveFeePercentages(price);
                const sellerAmt = parseFloat(((price * feeRes.sellerPct) / 100).toFixed(2));
                const marchantAmt = parseFloat(((price * feeRes.marchantPct) / 100).toFixed(2));
                const platformAmt = parseFloat((price - sellerAmt - marchantAmt).toFixed(2));
                await storage.createTransaction({
                  itemId: matchingItem.id,
                  requestId: agreement.requestId,
                  sellerId: agreement.sellerId,
                  marchantId: agreement.marchantId,
                  salePrice: price.toString(),
                  sellerEarning: sellerAmt.toString(),
                  marchantEarning: marchantAmt.toString(),
                  platformEarning: platformAmt.toString(),
                  feeTierId: feeRes.tierId,
                  sellerPercent: feeRes.sellerPct.toString(),
                  marchantPercent: feeRes.marchantPct.toString(),
                  platformPercent: feeRes.platformPct.toString(),
                  status: "completed",
                });
              }
            }
          }
        }

        const updated = await storage.getAgreementWithDetails(id);
        res.json(updated);
      } catch (error: any) {
        if (error?.statusCode === 400) {
          return res.status(400).json({ message: error.message });
        }
        console.error("Error signing agreement:", error);
        res.status(500).json({ message: "Failed to sign agreement" });
      }
    },
  );

  app.post(
    "/api/agreements/:id/send-pdf",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);

        const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
        const profile = await storage.getProfile(userId);
        if (!profile) return res.status(400).json({ message: "Profile required" });

        const agreement = await storage.getAgreementWithDetails(id);
        if (!agreement) return res.status(404).json({ message: "Agreement not found" });

        if (agreement.sellerId !== userId && agreement.marchantId !== userId && profile.role !== "admin") {
          return res.status(403).json({ message: "Not authorized" });
        }

        if (agreement.status !== "fully_signed") {
          return res.status(400).json({ message: "Only fully signed agreements can be emailed" });
        }

        const toEmail = currentUser?.email;
        if (!toEmail) return res.status(400).json({ message: "No email address on file for your account" });

        const toName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || toEmail;

        const parsedItems = JSON.parse(agreement.itemsSnapshot) as Array<{
          id: number;
          title: string;
          approvedPrice: number;
          fees: {
            sellerAmount: number;
            marchantAmount: number;
            platformAmount: number;
            sellerPct?: number;
            marchantPct?: number;
            platformPct?: number;
          };
        }>;

        const sellerName = agreement.seller
          ? `${agreement.seller.firstName || ""} ${agreement.seller.lastName || ""}`.trim() || agreement.seller.email || "Unknown"
          : "Unknown";
        const marchantName = agreement.reusse
          ? `${agreement.reusse.firstName || ""} ${agreement.reusse.lastName || ""}`.trim() || agreement.reusse.email || "Unknown"
          : "Unknown";

        const { generateAgreementPdfBytes } = await import("./pdf");
        const pdfBuffer = generateAgreementPdfBytes(agreement);

        const { sendAgreementPdfEmail } = await import("./email");
        await sendAgreementPdfEmail({
          toEmail,
          toName,
          agreementId: agreement.id,
          requestId: agreement.requestId,
          status: agreement.status,
          generatedAt: agreement.generatedAt,
          seller: agreement.seller ? { name: sellerName, email: agreement.seller.email } : null,
          marchand: agreement.marchand ? { name: marchantName, email: agreement.marchand.email } : null,
          items: parsedItems.map((item) => ({
            title: item.title,
            approvedPrice: item.approvedPrice,
            sellerAmount: item.fees.sellerAmount,
            marchantAmount: item.fees.marchantAmount,
            platformAmount: item.fees.platformAmount,
            sellerPct: item.fees.sellerPct,
            marchantPct: item.fees.marchantPct,
            platformPct: item.fees.platformPct,
          })),
          signatures: (agreement.signatures as Array<{ role: string; userName: string; signedAt: string }>).map((sig) => ({
            role: sig.role,
            name: sig.userName || "Unknown",
            signedAt: sig.signedAt,
          })),
          totalValue: parseFloat(agreement.totalValue),
          pdfBuffer,
        });

        res.json({ message: `Agreement PDF sent to ${toEmail}` });
      } catch (error) {
        console.error("Error sending agreement email:", error);
        res.status(500).json({ message: "Failed to send email" });
      }
    },
  );

  app.get(
    "/api/admin/agreements",
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const result = await storage.getAdminAgreements();
        res.json(result);
      } catch (error) {
        console.error("Error fetching admin agreements:", error);
        res.status(500).json({ message: "Failed to fetch agreements" });
      }
    },
  );

  const feeTierSchema = z.object({
    label: z.string().min(1),
    minPrice: z.string().min(1),
    maxPrice: z.string().optional().nullable(),
    sellerPercent: z.string().min(1),
    marchantPercent: z.string().min(1),
    platformPercent: z.string().min(1),
    currencyNote: z.string().optional(),
    isActive: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    const minP = parseFloat(data.minPrice);
    if (isNaN(minP) || minP < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "minPrice must be a non-negative number", path: ["minPrice"] });
    }
    if (data.maxPrice && data.maxPrice.trim() !== "") {
      const maxP = parseFloat(data.maxPrice);
      if (isNaN(maxP) || maxP < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "maxPrice must be a non-negative number", path: ["maxPrice"] });
      } else if (!isNaN(minP) && maxP <= minP) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "maxPrice must be greater than minPrice", path: ["maxPrice"] });
      }
    }
    const s = parseFloat(data.sellerPercent);
    const r = parseFloat(data.marchantPercent);
    const p = parseFloat(data.platformPercent);
    if (isNaN(s) || s < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "sellerPercent must be a non-negative number", path: ["sellerPercent"] });
    if (isNaN(r) || r < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "marchantPercent must be a non-negative number", path: ["marchantPercent"] });
    if (isNaN(p) || p < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "platformPercent must be a non-negative number", path: ["platformPercent"] });
    const total = s + r + p;
    if (Math.abs(total - 100) > 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Percentages must sum to 100 (currently ${total.toFixed(2)})`, path: ["platformPercent"] });
    }
  });

  async function checkTierOverlap(minPrice: string, maxPrice: string | null | undefined, excludeId?: number): Promise<string | null> {
    const newMin = parseFloat(minPrice);
    const newMax = maxPrice && maxPrice.trim() !== "" ? parseFloat(maxPrice) : Infinity;
    const allActive = await storage.getFeeTiers(true);
    for (const t of allActive) {
      if (excludeId !== undefined && t.id === excludeId) continue;
      const eMin = parseFloat(t.minPrice as string);
      const eMax = t.maxPrice ? parseFloat(t.maxPrice as string) : Infinity;
      const overlaps = !(newMax < eMin || eMax < newMin);
      if (overlaps) {
        return `Price range overlaps with active tier "${t.label}" (${eMin}–${t.maxPrice ?? "∞"})`;
      }
    }
    return null;
  }

  app.get("/api/admin/fee-tiers", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const tiers = await storage.getFeeTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching fee tiers:", error);
      res.status(500).json({ message: "Failed to fetch fee tiers" });
    }
  });

  app.post("/api/admin/fee-tiers", isAuthenticated, requireAdmin, validate(feeTierSchema), async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const { label, minPrice, maxPrice, sellerPercent, marchantPercent, platformPercent, currencyNote } = req.body;
      const overlapError = await checkTierOverlap(minPrice, maxPrice);
      if (overlapError) return res.status(400).json({ message: overlapError, errorCode: "TIER_OVERLAP" });
      const tier = await storage.createFeeTier({
        label,
        minPrice,
        maxPrice: maxPrice || null,
        sellerPercent,
        marchantPercent,
        platformPercent,
        currencyNote: currencyNote || "EUR/CHF",
        isActive: true,
      });
      await storage.logTierChange({
        feeTierId: tier.id,
        adminId,
        action: "create",
        newValues: tier,
      });
      res.json(tier);
    } catch (error) {
      console.error("Error creating fee tier:", error);
      res.status(500).json({ message: "Failed to create fee tier" });
    }
  });

  app.patch("/api/admin/fee-tiers/:id", isAuthenticated, requireAdmin, validate(feeTierSchema), async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getFeeTier(id);
      if (!existing) return res.status(404).json({ message: "Fee tier not found" });
      const { label, minPrice, maxPrice, sellerPercent, marchantPercent, platformPercent, currencyNote, isActive } = req.body;
      const willBeActive = isActive !== undefined ? isActive : existing.isActive;
      if (willBeActive) {
        const overlapError = await checkTierOverlap(minPrice, maxPrice, id);
        if (overlapError) return res.status(400).json({ message: overlapError, errorCode: "TIER_OVERLAP" });
      }
      const updated = await storage.updateFeeTier(id, {
        label,
        minPrice,
        maxPrice: maxPrice || null,
        sellerPercent,
        marchantPercent,
        platformPercent,
        currencyNote: currencyNote || "EUR/CHF",
        isActive: isActive !== undefined ? isActive : existing.isActive,
      });
      await storage.logTierChange({
        feeTierId: id,
        adminId,
        action: "update",
        previousValues: existing,
        newValues: updated,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating fee tier:", error);
      res.status(500).json({ message: "Failed to update fee tier" });
    }
  });

  app.delete("/api/admin/fee-tiers/:id", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getFeeTier(id);
      if (!existing) return res.status(404).json({ message: "Fee tier not found" });
      await storage.deleteFeeTier(id);
      await storage.logTierChange({
        feeTierId: id,
        adminId,
        action: "delete",
        previousValues: existing,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting fee tier:", error);
      res.status(500).json({ message: "Failed to delete fee tier" });
    }
  });

  app.get("/api/admin/fee-tiers/changelog", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const log = await storage.getFeeTierChangelog();
      res.json(log);
    } catch (error) {
      console.error("Error fetching fee tier changelog:", error);
      res.status(500).json({ message: "Failed to fetch changelog" });
    }
  });

  app.get("/api/admin/fee-tiers/uncovered-items", isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const uncoveredItems = await storage.getUncoveredItems();
      res.json(uncoveredItems);
    } catch (error) {
      console.error("Error fetching uncovered items:", error);
      res.status(500).json({ message: "Failed to fetch uncovered items" });
    }
  });

  app.get("/api/fee-tiers", isAuthenticated, async (req: any, res) => {
    try {
      const tiers = await storage.getFeeTiers(true);
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching fee tiers:", error);
      res.status(500).json({ message: "Failed to fetch fee tiers" });
    }
  });

  app.get("/api/fee-tiers/for-price", isAuthenticated, async (req: any, res) => {
    try {
      const amount = parseFloat(req.query.amount as string);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }
      const tier = await storage.getTierForPrice(amount);
      res.json(tier || null);
    } catch (error) {
      console.error("Error fetching tier for price:", error);
      res.status(500).json({ message: "Failed to fetch tier" });
    }
  });

  app.post(
    "/api/requests/:id/report",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const userId = req.user.id;
        const profile = await storage.getProfile(userId);
        if (!profile || profile.role !== "marchand")
          return res.status(403).json({ message: "Only resellers can report requests" });
        const request = await storage.getRequest(id);
        if (!request)
          return res.status(404).json({ message: "Request not found" });
        const schema = z.object({ reason: z.string().min(1) });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
          return res.status(400).json({ message: "Reason required" });
        await storage.reportRequest(id, userId, parsed.data.reason);
        const admins = await storage.getAllUsersWithProfiles();
        const adminIds = admins
          .filter((u: any) => u.profile?.role === "admin")
          .map((u: any) => u.id);
        await Promise.all(
          adminIds.map((adminId: string) =>
            storage.createNotification({
              userId: adminId,
              type: "request_flagged",
              title: "Demande signalée",
              message: `La demande #${id} a été signalée par un revendeur : ${parsed.data.reason}`,
              link: `/admin/requests`,
            })
          )
        );
        res.json({ message: "Request reported" });
      } catch (error) {
        console.error("Error reporting request:", error);
        res.status(500).json({ message: "Failed to report request" });
      }
    },
  );

  // Auth endpoints
  app.post("/api/auth/signin", signInLimiter, async (req: AuthRequest, res) => {
    try {
      const parsed = await signInSchema.parseAsync(req.body);
      const { email, password } = parsed;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        return res.status(403).json({ message: "Please verify your email before signing in" });
      }

      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await db.execute(
        sql`INSERT INTO sessions ("sessionToken", "userId", expires) VALUES (${sessionId}, ${user.id}, ${expiresAt})`
      );

      res.cookie("next-auth.session-token", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : undefined,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      console.error("Sign in error:", error);
      res.status(500).json({ message: "Sign in failed" });
    }
  });

  app.post("/api/auth/signout", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const sessionToken = req.cookies["next-auth.session-token"];
      if (sessionToken) {
        await db.execute(
          sql`DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}`
        );
      }
      res.clearCookie("next-auth.session-token");
      res.json({ success: true });
    } catch (error) {
      console.error("Sign out error:", error);
      res.status(500).json({ message: "Sign out failed" });
    }
  });

  app.get("/api/auth/session", async (req: AuthRequest, res) => {
    try {
      const sessionToken = req.cookies["next-auth.session-token"];
      if (!sessionToken) {
        return res.json(null);
      }

      const result = await db.execute(
        sql`SELECT "userId", expires FROM sessions WHERE "sessionToken" = ${sessionToken} AND expires > NOW()`
      );

      if (!(result as any)?.rows?.[0]) {
        res.clearCookie("next-auth.session-token");
        return res.json(null);
      }

      const session = (result as any).rows[0];

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        return res.json(null);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : undefined,
        },
        expires: session.expires,
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({ message: "Failed to get session" });
    }
  });

  app.get("/api/auth/user", async (req: AuthRequest, res) => {
    try {
      const sessionToken = req.cookies["next-auth.session-token"];
      if (!sessionToken) {
        return res.json(null);
      }

      const result = await db.execute(
        sql`SELECT "userId", expires FROM sessions WHERE "sessionToken" = ${sessionToken} AND expires > NOW()`
      );

      if (!(result as any)?.rows?.[0]) {
        res.clearCookie("next-auth.session-token");
        return res.json(null);
      }

      const session = (result as any).rows[0];
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (!user) {
        res.clearCookie("next-auth.session-token");
        return res.json(null);
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/logout", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const sessionToken = req.cookies["next-auth.session-token"];
      if (sessionToken) {
        await db.execute(
          sql`DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}`
        );
      }
      res.clearCookie("next-auth.session-token");
      res.redirect("/");
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  const registerSchema = z.object({
    email: z
      .string({ required_error: "Email is required" })
      .min(1, "Email is required")
      .email("Invalid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(32, "Password must be at most 32 characters"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });

  app.post("/api/auth/register", registerLimiter, async (req: AuthRequest, res) => {
    try {
      const parsed = await registerSchema.parseAsync(req.body);
      const { email, password, firstName, lastName } = parsed;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const passwordHash = await hashPassword(password);
      const userId = randomUUID();

      await db.execute(
        sql`INSERT INTO users (id, email, "passwordHash", "firstName", "lastName") VALUES (${userId}, ${email}, ${passwordHash}, ${firstName || null}, ${lastName || null})`
      );

      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.execute(
        sql`INSERT INTO sessions ("sessionToken", "userId", expires) VALUES (${sessionId}, ${userId}, ${expiresAt})`
      );

      res.cookie("next-auth.session-token", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      res.status(201).json({
        success: true,
        user: newUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/send-verification-code", verifyEmailLimiter, isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const codeId = randomUUID();

      await db.execute(
        sql`
          INSERT INTO email_verification_codes (id, "user_id", code, "expires_at")
          VALUES (${codeId}, ${userId}, ${code}, ${expiresAt})
          ON CONFLICT (id) DO NOTHING
        `
      );

      // TODO: Send code via email when email system is ready
      res.json({
        success: true,
        message: "Verification code sent to your email",
      });
    } catch (error) {
      console.error("Send verification code error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/auth/verify-email", verifyEmailLimiter, isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { code } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Verification code is required" });
      }

      // Find and validate the code
      const result = await db.execute(
        sql`
          SELECT id, "expires_at", "verified_at"
          FROM email_verification_codes
          WHERE "user_id" = ${userId} AND code = ${code}
        `
      );

      const verificationRecord = (result as any)?.rows?.[0];
      if (!verificationRecord) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (verificationRecord.verified_at) {
        return res.status(400).json({ message: "Email already verified" });
      }

      if (new Date() > new Date(verificationRecord.expires_at)) {
        return res.status(400).json({ message: "Verification code expired" });
      }

      // Mark as verified and update user
      await db.execute(
        sql`
          UPDATE email_verification_codes
          SET "verified_at" = NOW()
          WHERE id = ${verificationRecord.id}
        `
      );

      await db.execute(
        sql`
          UPDATE users
          SET "email_verified" = NOW()
          WHERE id = ${userId}
        `
      );

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post("/api/auth/forgot-password", forgotPasswordLimiter, async (req: AuthRequest, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const userResult = await db.execute(
        sql`SELECT id FROM users WHERE email = ${email}`
      );

      const user = (userResult as any)?.rows?.[0];
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: "If that email exists, a password reset link was sent",
        });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const tokenId = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.execute(
        sql`
          INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
          VALUES (${tokenId}, ${user.id}, ${resetToken}, ${expiresAt})
        `
      );

      // TODO: Send reset email with token when email system is ready
      res.json({
        success: true,
        message: "If that email exists, a password reset link was sent",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", resetPasswordLimiter, async (req: AuthRequest, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Reset token is required" });
      }

      if (!newPassword || typeof newPassword !== "string") {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Find and validate the token
      const tokenResult = await db.execute(
        sql`
          SELECT id, user_id, expires_at, used_at
          FROM password_reset_tokens
          WHERE token = ${token}
        `
      );

      const resetToken = (tokenResult as any)?.rows?.[0];
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (resetToken.used_at) {
        return res.status(400).json({ message: "This reset token has already been used" });
      }

      if (new Date() > new Date(resetToken.expires_at)) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password and update user
      const passwordHash = await hashPassword(newPassword);

      await db.execute(
        sql`
          UPDATE users
          SET "passwordHash" = ${passwordHash}, "updatedAt" = NOW()
          WHERE id = ${resetToken.user_id}
        `
      );

      // Mark token as used
      await db.execute(
        sql`
          UPDATE password_reset_tokens
          SET used_at = NOW()
          WHERE id = ${resetToken.id}
        `
      );

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  return httpServer;
}
