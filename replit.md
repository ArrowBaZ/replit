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
  schema.ts          - All data models (profiles, requests, items, meetings, messages, notifications, reviews)
  constants.ts       - Centralized constants (ITEM_CATEGORIES, ITEM_CONDITIONS, SERVICE_TYPES, etc.)
  models/auth.ts     - Auth models (users, sessions)
server/
  routes.ts          - All API endpoints
  storage.ts         - DatabaseStorage implementation
  db.ts              - Database connection
  replit_integrations/ - Auth + Object Storage integrations
client/src/
  App.tsx            - Main app with routing
  pages/             - All page components (incl. resellers.tsx, reseller-detail.tsx)
  components/        - Reusable components (sidebar, theme)
  hooks/             - Custom hooks (auth, toast, upload)
  lib/               - Utilities (queryClient, auth-utils, i18n)
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
- **File upload pattern (intentional)**: All file uploads use a presigned URL flow — client calls `POST /api/uploads/request-url` to get a GCS presigned URL, uploads the file directly from the browser to GCS, then sends only metadata (fileName, fileUrl, fileSize, fileType) to the backend API (e.g. `POST /api/items/:id/documents`). The backend never handles raw file bytes. This is enforced app-wide via the `useUpload` hook (`client/src/hooks/use-upload.ts`).
  - fileUrl is stored server-side only; the document list API (`GET /api/items/:id/documents`) strips it from responses.
  - Document downloads go through an authenticated proxy (`GET /api/items/:id/documents/:docId/download`) that fetches from object storage server-side, never exposing raw GCS URLs to clients.

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
- Constants foundation (PRD refactor Phase 1):
  - `shared/constants.ts` created with all centralized constants (ITEM_CATEGORIES, ITEM_CONDITIONS, SERVICE_TYPES, REQUEST_STATUSES, ITEM_STATUSES, USER_ROLES, CATEGORY_ALLOWED_FIELDS, i18n key maps)
  - routes.ts, storage.ts, create-request.tsx import from `@shared/constants`
  - Schema.ts re-exports ITEM_CATEGORIES from constants
- Reseller Dashboard Enhancement (PRD 2.4):
  - GET /api/earnings-summary: monthly earnings breakdown (last 6 months) for reusse/seller
  - GET /api/stats/activity: active requests, sold items, sold this month, messages this month
  - reusse-dashboard.tsx: recharts BarChart for monthly earnings + activity stats cards
- Reseller Discovery (PRD 2.5):
  - `reviews` table: seller→reusse ratings (overall, communication, reliability, handling)
  - GET /api/resellers: list approved resellers with aggregated stats
  - GET /api/resellers/:id: reseller detail + multi-dimensional ratings
  - GET /api/resellers/:id/reviews: all reviews for a reseller
  - POST /api/requests/:id/review: submit review (sellers only, completed requests)
  - /resellers page: search + sort, reseller cards with ratings
  - /resellers/:id page: reseller profile with StarPicker review form
  - Seller sidebar has "Discover Resellers" nav link to /resellers
- Request Flagging (PRD 2.2 simplified):
  - POST /api/requests/:id/report: resellers report suspicious requests
  - Report button + inline form in request-detail for resellers (pending/matched/in_progress requests)
  - Flags request as "flagged" and sends notifications to all admins
- Photo Upload Guidance (PRD 2.3):
  - Inline tips panel in ItemPhotoUploadArea in request-detail add-item dialog
  - Shows tips: natural light, brand label, defects, angles (bilingual)
- UX fixes (8 items from gap analysis):
  1. Seller preferred dates (preferredDateStart/End) shown in request detail for Reusse
  2. Contact info card (phone, address) shown for the other party once request is matched (GET /api/requests/:id/contact)
  3. Condition labels use translated values (t("condNew") etc.) instead of raw English strings
  4. Counter-offer badge shown on item card when sellerCounterOffer=true and status=pending_approval
  5. Mandatory decline reason inline form (textarea + confirm) replaces direct decline button
  6. Duplicate article button for Reusse on all item cards (calls POST /api/items/:id/duplicate)
  7. Declined item shows decline reason in a red callout
  8. Item sold notification already existed in server; confirmed working
- Seller Documentation & Media Hub (Task #3):
  - `item_documents` table: per-item document records (photo/certificate) with uploader, filename, fileUrl (private), fileType, fileSize, createdAt
  - `item_document_requests` table: idempotent per-reseller-per-item document requests
  - GET /api/items/:id/documents — auth-gated (seller/reusse/admin); fileUrl stripped from response
  - POST /api/items/:id/documents — validates extension, file size (photos 10MB / certs 5MB), fileUrl origin (/objects/), per-item count limits (5 photos / 3 certs), sends notification + WS event
  - POST /api/items/:id/document-request — idempotent (409 on duplicate), persists to DB, sends chat message + notification + WS event
  - GET /api/items/:id/document-request-status — returns {requested, requestedAt}; checks item participant/admin auth
  - GET /api/items/:id/documents/:docId/download — authenticated file proxy (streams from object storage, never exposes raw GCS URLs)
  - ItemDocumentsSection component: photo 3-col gallery + per-photo audit row (filename/uploader/date/size/download); certificate list; Photo/Certificate type selector in upload dialog; reseller "Request Documents" button with server-persisted state
  - Item creation form: explicit certificate/photo type selector in doc upload area
