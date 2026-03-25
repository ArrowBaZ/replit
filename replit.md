# Sellzy - Fashion Resale Marketplace

## Overview
Sellzy connects clothing sellers with expert resellers. Sellers submit resale requests, get matched with local resellers, schedule meetings for item pickup, track items through the resale process, and manage earnings.
Hello world

## Brand Identity
- Primary Navy: #2C3E50 (HSL 210 29% 24%)
- Success Green: #27AE60 (HSL 145 63% 42%)
- Accent Red: #E74C3C (HSL 6 78% 57%)
- Commission Split: 80% seller, 20% Reusse

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Storage**: Replit Object Storage for file uploads
- **Routing**: wouter (frontend), Express (backend API)

## User Roles
1. **Seller** - Creates service requests, tracks items, views earnings
2. **Reusse** - Accepts requests, adds items, manages listings, earns commission
3. **Admin** - Manages users, approves Reusse applications, views analytics

## Service Types
- Classic: Standard pickup and resale
- Express: Priority handling
- SOS Dressing: Full wardrobe cleanout

## Project Structure
```
shared/
  schema.ts          - All data models (profiles, requests, items, meetings, messages, notifications)
  models/auth.ts     - Auth models (users, sessions)
server/
  routes.ts          - All API endpoints
  storage.ts         - DatabaseStorage implementation
  db.ts              - Database connection
  replit_integrations/ - Auth + Object Storage integrations
client/src/
  App.tsx            - Main app with routing
  pages/             - All page components
  components/        - Reusable components (sidebar, theme)
  hooks/             - Custom hooks (auth, toast, upload)
  lib/               - Utilities (queryClient, auth-utils)
```

## Item Categories (Task #2)
16 French item categories supported:
- tout_mode, vetements, montres_bijoux, accessoires_bagagerie, ameublement, electromenager, decoration, linge_de_maison, electronique, ordinateurs, telephones_objets_connectes, livres, vins, instruments_de_musique, jeux_jouets, velos
- Each category has dynamic filter fields (material, author, vintage, deviceStorage, etc.)
- Luxury categories (montres_bijoux, accessoires_bagagerie) show certificate photo upload
- Item cards display category badge
- Items list has category filter dropdown (shows only categories in user's items)

## Key Decisions
- Schema-first approach with Drizzle ORM
- Dark sidebar with green accent for brand identity
- Replit Auth only (no custom authentication)
- Subscription/Stripe deferred to Phase 2

## Recent Changes
- Initial MVP build: complete frontend + backend
- Database schema: profiles, requests, items, meetings, messages, notifications, transactions
- All pages: landing, onboarding, seller/reusse/admin dashboards, request management, messaging, profile
- API: Full CRUD for all entities with auth middleware
- Multilingual i18n system (English/French) with flag-based language switcher on landing page
  - i18n system: client/src/lib/i18n.tsx with I18nProvider, useI18n hook, useTranslateStatus helper
  - French is default language, stored in localStorage as "sellzy-lang"
  - All pages translated: landing, onboarding, dashboards, requests, items, messages, schedule, profile, admin
  - UK and French flag SVG buttons in landing page navbar for language switching
- Commission/Transaction tracking system (transactions table with 80/20 seller/reseller split)
- Item approval workflow: sellers can approve/counter-offer/decline pricing on items
- Item lifecycle: resellers can mark items as listed (with platform) and sold (with sale price)
- Request lifecycle: cancel and complete request endpoints with notifications
- Earnings API endpoint for both sellers and resellers
- Static pages: FAQ, Contact Us, Terms of Service, Privacy Policy (all bilingual)
- Landing page footer links to static pages
- Enhanced request creation: multi-step wizard with category badges, condition cards, brands input, preferred meeting dates
- Item photo uploads: Object Storage integration with presigned URLs, multi-photo upload in add-item dialog
- Item photo display: thumbnails in request detail and items list pages
- Items list filtering: search by name/brand, filter by status (pending_approval, approved, listed, sold)
- Meeting management: cancel and reschedule meetings with notifications to other party
- API endpoints: PATCH /api/meetings/:id/cancel, PATCH /api/meetings/:id/reschedule
- Admin Listing View (PRD 2.6): `moderation_actions` table in schema, admin API endpoints (GET list + filter, POST flag/message/reject, GET moderation history), `/admin/requests` page with search + status filter + Flag/Message/Reject modals with bilingual i18n
- UX fixes (8 items from gap analysis):
  1. Seller preferred dates (preferredDateStart/End) shown in request detail for Reusse
  2. Contact info card (phone, address) shown for the other party once request is matched (GET /api/requests/:id/contact)
  3. Condition labels use translated values (t("condNew") etc.) instead of raw English strings
  4. Counter-offer badge shown on item card when sellerCounterOffer=true and status=pending_approval
  5. Mandatory decline reason inline form (textarea + confirm) replaces direct decline button
  6. Duplicate article button for Reusse on all item cards (calls POST /api/items/:id/duplicate)
  7. Declined item shows decline reason in a red callout
  8. Item sold notification already existed in server; confirmed working
