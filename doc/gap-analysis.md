# Sellzy MVP — Gap Analysis Report
**Date:** March 13, 2026  
**Audited Against:** Phases B, C, D, E from the MVP roadmap

---

## Summary

| Phase | Description | Status |
|-------|-------------|--------|
| B | Seller Dashboard & Request Flow | ✅ Complete |
| C | Reusse Dashboard & Workflow | ⚠️ Mostly complete — 1 gap |
| D | Communication & Payments | ⚠️ Partially complete — 2 gaps |
| E | Admin, Profile & Polish | ⚠️ Mostly complete — 2 gaps |

---

## Phase B: Seller Dashboard & Request Flow

| Prompt | Feature | Status | Notes |
|--------|---------|--------|-------|
| B1 | Seller Dashboard Layout & Navigation | ✅ Done | `seller-dashboard.tsx` — stat cards for active requests, sold items, total earnings, recent activity |
| B2 | Request Creation — Service Selection | ✅ Done | Multi-step form in `create-request.tsx` — Classic, Express, SOS Dressing with visual cards |
| B3 | Request Creation — Item Details | ✅ Done | Category badges, condition cards, brands input, estimated value field |
| B4 | Request Creation — Meeting Preferences | ✅ Done | Preferred date range, location field |
| B5 | Request Creation — Review & Submit | ✅ Done | Step 4 summary with all details before submit |
| B6 | My Requests List | ✅ Done | `requests-list.tsx` — shows seller's own requests with status badges |
| B7 | Request Details Page | ✅ Done | `request-detail.tsx` (774 lines) — meetings, items, pricing approval, photos, messaging link |

**Phase B verdict: Fully implemented.**

---

## Phase C: Reusse Dashboard & Workflow

| Prompt | Feature | Status | Notes |
|--------|---------|--------|-------|
| C1 | Reusse Dashboard Layout | ✅ Done | `reusse-dashboard.tsx` — stats for active clients, items, earnings; upcoming meetings |
| C2 | Available Requests & Matching | ✅ Done | `/api/requests/available` + `/available` route shows open requests; Reusse can accept |
| C3 | My Clients Management | ⚠️ Partial | No dedicated "My Clients" view. Accepted clients appear as requests in the Reusse dashboard, but there is no separate client list page with client-centric view (contact info, all requests per client, etc.) |
| C4 | Item Cataloging Interface | ✅ Done | Add-item dialog in `request-detail.tsx` with title, brand, size, category, condition, price range, photos (up to 5) |
| C5 | Inventory Management | ✅ Done | `items-list.tsx` — search by name/brand, filter by status (pending_approval, approved, listed, sold) |

**Gap requiring input — C3:**  
> Should "My Clients" be a dedicated page listing each accepted seller (with their contact details and all associated requests), or is the current request-centric view in the Reusse dashboard sufficient for MVP?

---

## Phase D: Communication & Payments

| Prompt | Feature | Status | Notes |
|--------|---------|--------|-------|
| D1 | Messaging Backend (Socket.io) | ⚠️ Partial | Backend stores messages in PostgreSQL. Real-time is simulated via polling (`refetchInterval: 3000–5000ms`). No actual WebSocket/Socket.io connection. |
| D2 | Messaging Frontend | ✅ Done | `messages.tsx` — conversation list, message thread, send message form |
| D3 | Notification System | ✅ Done | Notifications created on key events (request accepted, item added, meeting scheduled, etc.); in-app read/unread state |
| D4 | Stripe Integration | ❌ Not done | No Stripe or payment gateway integrated. No checkout flow, subscription, or payout system. |
| D5 | Commission Calculation | ✅ Done | 80/20 split computed from `item.salePrice` in both dashboards; `transactions` table exists in schema |
| D6 | Earnings Dashboards | ✅ Done | Seller sees 80% of sold items total; Reusse sees 20% — displayed on both dashboards |

**Gaps requiring input — D1 & D4:**

> **D1 — Real-time Messaging:** Currently messages refresh via polling every 3–5 seconds. This works but is not true real-time. The WebSocket integration blueprint is already installed in the project.  
> **Question:** Should I upgrade messaging to use actual WebSockets for instant delivery, or is polling acceptable for MVP?

> **D4 — Stripe:** No payment processing exists. The commission split is calculated and displayed but no actual money movement is handled.  
> **Question:** Is Stripe integration required for the current MVP release, or is commission tracking/display sufficient for now? If Stripe is needed, do you have a Stripe account/API key to connect?

---

## Phase E: Admin, Profile & Polish

| Prompt | Feature | Status | Notes |
|--------|---------|--------|-------|
| E1 | Admin Dashboard | ✅ Done | `admin-dashboard.tsx` — platform stats (total users, requests, items, active resellers) |
| E2 | User Management | ✅ Done | Admin can list all users with roles and status |
| E3 | Reusse Approval System | ✅ Done | Admin can approve/reject Reusse applications; `/api/admin/applications` endpoint |
| E4 | Profile Management | ✅ Done | `profile.tsx` — edit name, phone, address, city, bio; Reusse-specific fields (SIRET, experience) |
| E5 | Settings Page | ❌ Not done | No dedicated Settings page exists. Language preference is handled via the landing page switcher but there is no in-app settings section (notification preferences, contact method preference, account deletion, etc.) |
| E6 | Meeting Scheduling | ✅ Done | `schedule.tsx` + meeting creation in request detail; cancel and reschedule with notifications |
| E7 | Price Approval Workflow | ✅ Done | Seller can approve, counter-offer, or decline item pricing; Reusse can adjust after counter-offer |
| E8 | Search Functionality | ⚠️ Partial | Items list has search + status filter. Requests list has **no search or filter** (no search by keyword, service type, or status filtering) |
| E9 | Loading States & Error Handling | ✅ Done | `isLoading`/`isPending` states used throughout; error toasts on failures |
| E10 | Email Templates | ❌ Not done | No email sending integrated. All notifications are in-app only. |

**Gaps requiring input — E5 & E10:**

> **E5 — Settings Page:** A basic settings page could include: language switcher (currently only on landing), notification preferences, preferred contact method, and account deletion.  
> **Question:** Should I build a Settings page for MVP, and if so, which settings matter most to you?

> **E10 — Email Templates:** No email provider is connected. Adding emails would require an external service (e.g. Resend, SendGrid).  
> **Question:** Is email notification a requirement for this MVP release?

---

## Items Fixed (No Input Required)

The following gaps have been resolved:

| # | Item | Status |
|---|------|--------|
| 1 | Add search + status filter to the Requests List page | ✅ Done — search by type/location/notes, filter by status (all/pending/matched/scheduled/in_progress/completed/cancelled) |
| 2 | Upgrade messaging from polling to WebSocket | ✅ Done — WebSocket server on `/ws` path; messages push instantly to both sender and receiver in real time |

---

## Questions Summary (Your Input Needed)

1. **C3 — My Clients:** Dedicated client list page, or is request-centric view enough for MVP?
2. **D1 — Real-time Messaging:** Upgrade to WebSockets, or keep polling for MVP?
3. **D4 — Stripe:** Required now, or deferred? If now, do you have a Stripe API key?
4. **E5 — Settings Page:** Build it now? Which settings are most important?
5. **E10 — Email Notifications:** Required for MVP? If yes, which email provider do you prefer?
