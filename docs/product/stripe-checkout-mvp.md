---
tags: [copilot, prd]
feature: stripe-checkout-mvp
status: accepted
date: 2026-10-19
type: feat
origin: brainstorms/2026-10-19-stripe-checkout-mvp.md
---

# Stripe Checkout MVP

## Overview

Add hosted Stripe Checkout so a logged-in customer can pay for listed items, see success or cancel, and receive a receipt. On payment, mark those items sold and write the existing seller/reseller fee split. Admins can list all payments, filter by user, and open per-user history.

## Problem

Stripe is not integrated. Sales are recorded only when a reseller marks an item sold. There is no cart, no `/checkout`, and no admin payment list. Email is mocked.

## Scope

In scope:

- Checkout enabled only for logged-in users
- Login gate: `/login?redirect=/checkout`
- Product and cart summary before payment
- Success page with order confirmation
- Cancel page
- Receipt email after a successful transaction
- Admin filter by user, complete transactions list, per-user payment history
- Webhook marks items sold and writes fee-split transactions

Out of scope:

- Stripe Connect payouts
- Refunds UI
- Subscriptions
- Replacing external listing sites

## Implementation plan

1. Schema: cart lines and Stripe fields (`stripeCheckoutSessionId` unique, `stripePaymentIntentId`, `payerUserId`, cart snapshot). Push with `npm run db:push`.
2. Storage: cart CRUD, create/find payment by session id, admin list with user filter, per-user history.
3. Stripe service: Checkout Session (EUR, `mode: payment`), webhook signature verify, `checkout.session.completed` handler that is idempotent.
4. On paid: mark each line item sold, write fee-split rows the same way mark-sold does, send receipt via `server/email.ts` mock.
5. Routes: cart, create session, success lookup, `POST /api/webhooks/stripe` (raw body), admin list and user filter.
6. UI: add-to-cart on listed items, `/checkout`, `/checkout/success`, `/checkout/cancel`, login redirect, `/admin/transactions`, per-user history.
7. i18n keys in `locales/en.json` and `locales/fr.json`.
8. Tests for gate, session create, webhook idempotency, and admin filter.
9. Env documented: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

## Acceptance

- Guest cannot pay; they land on login with `redirect=/checkout` and return there after sign-in.
- Logged-in user sees lines and total, then Stripe Checkout.
- Success page confirms the order. Cancel does not create a sale and keeps the cart.
- Webhook (once) marks items sold, writes splits, sends receipt. A second delivery does nothing extra.
- Admin sees all transactions and can filter to one user.
