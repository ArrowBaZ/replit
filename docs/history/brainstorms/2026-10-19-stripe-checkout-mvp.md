---
tags: [copilot, brainstorm]
topic: Stripe Checkout MVP
date: 2026-10-19
feature_slug: stripe-checkout-mvp
---

# Brainstorm: Stripe Checkout MVP

## Understanding summary

- Close the payments gap with hosted Stripe Checkout in the sandbox the Stripe account manager opened.
- Customers pay for listed inventory from a cart. Guests are gated.
- Admins see every payment, filter by user, and open per-user history.
- Why: Stripe validated the flow; this is the accepted MVP slice, not Connect payouts or subscriptions.
- Constraint: keep existing auth, EUR, and consignment `transactions` created when an item is marked sold. Checkout wraps listed items.
- Non-goals: Stripe Connect payouts, refunds UI, subscriptions, replacing Vinted/Leboncoin listing.

## Assumptions

- Guest hitting Checkout or Pay is sent to `/login?redirect=/checkout`. After login they return to `/checkout`.
- Checkout is disabled until the user is authenticated. `/checkout` itself also enforces login.
- Cart is listed inventory, priced from the approved/sale price. Summary is shown before redirecting to Stripe.
- Stripe Checkout Session: `success_url` is `/checkout/success?session_id={CHECKOUT_SESSION_ID}`, `cancel_url` is `/checkout/cancel`.
- Webhook `checkout.session.completed` is the source of truth. A receipt is sent through the existing mock mailer until a provider key exists.
- New payment records store Stripe IDs and `userId`. Manual mark-sold rows stay. Stripe-paid sales are tagged.
- Sandbox keys live in `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, plus existing `APP_BASE_URL`.
- MVP volume. Webhook signatures are verified. Secrets are not logged.
- Successful Checkout marks those items sold and writes the usual seller/reseller fee-split rows.

## Approaches considered

### Approach 1: Hosted Checkout + mark sold (chosen)

Stripe-hosted Checkout Session. Server cart. Webhook marks items sold and writes fee-split transactions.

- Pros: matches the awarded scope, PCI stays with Stripe, reuses mark-sold fee logic.
- Cons: user leaves the app for payment; webhook must be reachable in sandbox.

### Approach 2: Embedded Payment Element

Card form stays on `/checkout`.

- Pros: no redirect.
- Cons: more PCI/UI surface than the proposal asked for.

### Approach 3: Record Stripe payment only

Do not mark items sold.

- Rejected: the client confirmed items should be marked sold and the usual split written.

## Decision log

| Decision | Alternatives | Why |
|----------|--------------|-----|
| Hosted Stripe Checkout | Embedded Payment Element; payment-only record | Awarded scope; PCI with Stripe |
| Cart is listed items | Service fees; sandbox demo products | Current flow is consignment inventory |
| Login gate to `/login?redirect=/checkout` | Hide checkout entirely | Explicit redirect in the proposal |
| Webhook is source of truth | Trust success-page query string | Stripe can retry; success URL is not proof |
| Idempotency on `stripeCheckoutSessionId` | Re-process every event | Prevents double sold / double email |
| Mark items sold and write fee split | Payments-only; mark sold without split | Confirmed by client |
| Admin page `/admin/transactions` | Only profile history | Proposal asks for a complete list plus per-user history |
| Mock receipt mailer | Block until Resend/SendGrid | Matches current email module |

## Final design

### Customer flow

1. Listed items can be added to a server-side cart. Unauthenticated users see Checkout disabled and are sent to `/login?redirect=/checkout`. After login they return to `/checkout`.
2. `/checkout` shows product lines, quantities, unit prices, and total before Pay. Pay creates a Stripe Checkout Session (`mode: payment`, EUR) and redirects to Stripe.
3. Success URL is `/checkout/success?session_id={CHECKOUT_SESSION_ID}`. Cancel URL is `/checkout/cancel`.
4. Webhook `checkout.session.completed` (signature verified):
   - persist/update the payment (session id, payment intent id, user, amount, status `paid`)
   - mark each line item sold with the paid unit price
   - create fee-split `transactions` the same way mark-sold does today
   - send the receipt email
5. Success page shows order confirmation from the session. Cancel page says payment was not taken and offers a return to the cart.

### Admin

- `/admin/transactions` for admins only.
- Complete list: date, payer, amount, Stripe status, item titles, seller, reseller.
- Filter by user (payer, seller, or reseller).
- Per-user payment history on the user profile or a Payments tab.
- Manual mark-sold rows without Stripe IDs still appear. Stripe-paid sales show session and payment-intent IDs.

### Data

- Extend `transactions` or add a small `payments` table linked to them: `stripeCheckoutSessionId`, `stripePaymentIntentId`, `payerUserId`, `cartSnapshot`. Unique on session id.
- Cart stored per user in the database.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_BASE_URL`.

### Errors

- Unauthenticated Pay returns 401 and the login redirect.
- Empty cart or item no longer listed blocks session create.
- Stripe or webhook signature failure returns 400 and does not mark sold or send email.
- Success page with an unknown or unpaid session shows “payment pending”, not a fake confirmation.
- Checkout cancel writes no sale and keeps the cart.

### Tests

- Login gate and `redirect=/checkout`.
- Session create requires auth and listed items.
- Webhook idempotency, mark-sold, and fee split.
- Admin list and user filter.

## Risks

- Local webhook delivery needs the Stripe CLI or a tunnel; sandbox keys in `.env` are not enough by themselves.
- Mark-sold today is a reseller action. Checkout must not double-write if the webhook retries or if the item was already sold.
- Receipts stay in the mock mailer until a real provider is configured.
