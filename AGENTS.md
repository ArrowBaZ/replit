# Sellzy - AI Agent & Developer Context

> Fashion resale marketplace connecting clothing sellers with expert resellers (Reusses).
> Commission split: 80% seller / 20% Reusse.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up PostgreSQL (see "Local Database Setup" section below)
export DATABASE_URL="postgresql://user:password@localhost:5432/sellzy"

# 3. Push schema to database
npm run db:push

# 4. Start dev server (port 5000)
npm run dev
```

## Commands

| Action | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Start (prod) | `npm run start` |
| Type check | `npm run check` |
| Push schema | `npm run db:push` |

---

## Architecture

```
shared/                     # Shared types & schema (both client + server)
  schema.ts                 # Drizzle ORM schema — ALL tables, enums, Zod schemas, types
  models/auth.ts            # User + session type definitions

server/                     # Express 5 backend
  index.ts                  # App entry, middleware chain, HTTP server
  routes.ts                 # ALL API endpoints (31 routes)
  storage.ts                # IStorage interface + DatabaseStorage (Drizzle)
  db.ts                     # PostgreSQL pool + Drizzle instance
  vite.ts                   # Vite dev server middleware (dev only)
  static.ts                 # Static file serving (prod only)
  replit_integrations/
    auth/                   # Replit OIDC auth (Passport + OpenID Connect)
      index.ts              # setupAuth() — session store, passport config
      replitAuth.ts         # OIDC strategy, token refresh logic
      routes.ts             # /api/login, /api/callback, /api/logout
      storage.ts            # User upsert on auth callback
    object_storage/         # Replit Object Storage (GCS backend)
      index.ts              # setupObjectStorage() registration
      objectStorage.ts      # Presigned URL generation, file streaming
      objectAcl.ts          # ACL policy for uploaded objects
      routes.ts             # /api/uploads/request-url, /objects/*

client/                     # React 18 SPA
  index.html                # Entry HTML
  src/
    App.tsx                 # Wouter routing, auth guards, layout
    pages/                  # All page components
      landing.tsx           # Marketing landing page
      onboarding.tsx        # Post-login role selection + profile creation
      seller-dashboard.tsx  # Seller stats, recent requests, quick actions
      reusse-dashboard.tsx  # Reusse stats, available requests, assignments
      admin-dashboard.tsx   # Admin stats, user list, reusse approval
      create-request.tsx    # 4-step wizard (service > items > location > review)
      request-detail.tsx    # Full request view with items, meetings, actions
      requests-list.tsx     # User's requests list (also serves /available)
      items-list.tsx        # Items with search + status filter
      messages.tsx          # Conversations list + chat (polling-based)
      profile.tsx           # Profile view/edit form
      schedule.tsx          # Meetings calendar (upcoming/past)
      faq.tsx               # Static FAQ
      contact.tsx           # Static contact form (UI only, no backend)
      terms.tsx             # Terms of service
      privacy.tsx           # Privacy policy
      not-found.tsx         # 404 page
    components/
      app-sidebar.tsx       # Role-aware sidebar navigation
      ObjectUploader.tsx    # Uppy-based file uploader with presigned URLs
      theme-provider.tsx    # Dark/light theme context
      theme-toggle.tsx      # Theme toggle button
      ui/                   # 40+ shadcn/ui components
    hooks/
      use-auth.ts           # Auth state (user, isLoading, logout)
      use-upload.ts         # File upload with presigned URLs
      use-toast.ts          # Toast notifications
      use-mobile.tsx        # Mobile viewport detection
    lib/
      i18n.tsx              # I18nProvider, useI18n hook, EN/FR translations (~180 keys)
      queryClient.ts        # TanStack Query client + apiRequest() helper
      auth-utils.ts         # 401 detection + redirect to login
      utils.ts              # Tailwind cn() utility
```

---

## Database Schema

**ORM:** Drizzle with PostgreSQL (`pg` driver)
**Schema file:** `shared/schema.ts`
**Push command:** `npm run db:push` (no migration files — uses Drizzle push)

### Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR | PK, auto UUID |
| email | VARCHAR | UNIQUE |
| firstName | VARCHAR | |
| lastName | VARCHAR | |
| profileImageUrl | VARCHAR | |
| createdAt | TIMESTAMP | default: now |
| updatedAt | TIMESTAMP | default: now |

#### `sessions` (Replit Auth session store)
| Column | Type | Notes |
|--------|------|-------|
| sid | VARCHAR | PK |
| sess | JSONB | |
| expire | TIMESTAMP | Indexed |

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| userId | VARCHAR | UNIQUE, FK → users.id |
| role | VARCHAR(20) | "seller", "reusse", "admin" |
| phone | VARCHAR(20) | |
| address | TEXT | |
| city | VARCHAR(100) | |
| postalCode | VARCHAR(10) | |
| department | VARCHAR(100) | |
| bio | TEXT | Reusse only |
| experience | TEXT | Reusse only |
| siretNumber | VARCHAR(20) | Reusse only |
| status | VARCHAR(20) | Default: "approved". Reusse: "pending" |
| preferredContactMethod | VARCHAR(20) | "email", "phone", "sms" |
| createdAt, updatedAt | TIMESTAMP | |

#### `requests`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| sellerId | VARCHAR | FK → users.id |
| reusseId | VARCHAR | FK → users.id, nullable |
| serviceType | VARCHAR(20) | "classic", "express", "sos_dressing" |
| status | VARCHAR(20) | "pending" → "matched" → "scheduled" → "in_progress" → "completed"/"cancelled" |
| itemCount | INTEGER | |
| estimatedValue | NUMERIC | |
| categories | TEXT[] | Array |
| condition | VARCHAR(20) | |
| brands | TEXT | |
| meetingLocation | TEXT | |
| preferredDateStart | TIMESTAMP | |
| preferredDateEnd | TIMESTAMP | |
| notes | TEXT | |
| createdAt, updatedAt, completedAt | TIMESTAMP | |

#### `items`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| requestId | INTEGER | FK → requests.id, nullable |
| sellerId | VARCHAR | FK → users.id |
| reusseId | VARCHAR | FK → users.id, nullable |
| title | VARCHAR(255) | |
| description | TEXT | |
| brand | VARCHAR(100) | |
| size | VARCHAR(20) | |
| category | VARCHAR(20) | |
| condition | VARCHAR(20) | |
| photos | TEXT[] | Array of object storage paths |
| minPrice, maxPrice | NUMERIC | Price range proposed by reusse |
| approvedPrice | NUMERIC | Final approved price |
| priceApprovedBySeller | BOOLEAN | Default: false |
| status | VARCHAR(20) | "pending_approval" → "approved" → "listed" → "sold" / "returned" |
| listedAt, soldAt | TIMESTAMP | |
| salePrice | NUMERIC | Actual sale price |
| platformListedOn | VARCHAR(100) | Where item is listed |
| createdAt, updatedAt | TIMESTAMP | |

#### `meetings`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| requestId | INTEGER | FK → requests.id |
| scheduledDate | TIMESTAMP | |
| location | TEXT | |
| duration | INTEGER | Default: 60 (minutes) |
| status | VARCHAR(20) | "scheduled", "cancelled" |
| notes | TEXT | |
| createdAt | TIMESTAMP | |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| senderId | VARCHAR | FK → users.id |
| receiverId | VARCHAR | FK → users.id |
| requestId | INTEGER | FK → requests.id, nullable |
| content | TEXT | |
| isRead | BOOLEAN | Default: false |
| createdAt | TIMESTAMP | |

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| userId | VARCHAR | FK → users.id |
| type | VARCHAR(50) | See notification types below |
| title | VARCHAR(255) | |
| message | TEXT | |
| link | VARCHAR(500) | |
| isRead | BOOLEAN | Default: false |
| createdAt | TIMESTAMP | |

Notification types: `request_received`, `request_accepted`, `meeting_scheduled`, `item_added`, `item_approved`, `item_declined`, `item_listed`, `item_sold`, `meeting_cancelled`, `meeting_rescheduled`, `reusse_approved`, `reusse_rejected`

#### `transactions`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL | PK |
| itemId | INTEGER | FK → items.id, nullable |
| requestId | INTEGER | FK → requests.id, nullable |
| sellerId | VARCHAR | FK → users.id |
| reusseId | VARCHAR | FK → users.id |
| salePrice | NUMERIC | |
| sellerEarning | NUMERIC | salePrice * 0.8 |
| reusseEarning | NUMERIC | salePrice * 0.2 |
| status | VARCHAR(20) | Default: "completed" |
| createdAt | TIMESTAMP | |

### Zod Insert Schemas

All available from `shared/schema.ts`:
- `insertProfileSchema`
- `insertRequestSchema`
- `insertItemSchema`
- `insertMeetingSchema`
- `insertMessageSchema`
- `insertNotificationSchema`
- `insertTransactionSchema`

### TypeScript Types

All exported from `shared/schema.ts`:
- `Profile`, `InsertProfile`
- `Request`, `InsertRequest`
- `Item`, `InsertItem`
- `Meeting`, `InsertMeeting`
- `Message`, `InsertMessage`
- `Notification`, `InsertNotification`
- `Transaction`, `InsertTransaction`
- `UpsertUser` (from `shared/models/auth.ts`)

---

## API Endpoints (31 routes)

### Authentication (Replit OIDC)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/login` | No | Redirect to Replit OAuth |
| GET | `/api/callback` | No | OIDC callback handler |
| GET | `/api/logout` | No | Clear session + logout |
| GET | `/api/auth/user` | isAuthenticated | Get current user |

### Profiles

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/profile` | requireAuth | Get own profile |
| POST | `/api/profile` | requireAuth | Create profile (onboarding) |
| PATCH | `/api/profile` | requireAuth | Update profile |

### Requests

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/requests` | requireAuth | List user's requests (role-filtered) |
| GET | `/api/requests/available` | requireAuth | List unmatched pending requests |
| GET | `/api/requests/:id` | requireAuth | Get request details |
| POST | `/api/requests` | requireAuth | Create request |
| POST | `/api/requests/:id/accept` | requireAuth | Reusse accepts request |
| PATCH | `/api/requests/:id/cancel` | requireAuth | Cancel request |
| PATCH | `/api/requests/:id/complete` | requireAuth | Complete request |

### Items

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/items` | requireAuth | List user's items |
| GET | `/api/requests/:id/items` | requireAuth | Get items in request |
| POST | `/api/requests/:id/items` | requireAuth | Add item to request |
| POST | `/api/items/:id/approve` | requireAuth | Seller approves item pricing |
| POST | `/api/items/:id/counter-offer` | requireAuth | Seller counters price |
| POST | `/api/items/:id/decline` | requireAuth | Seller declines item |
| POST | `/api/items/:id/list` | requireAuth | Mark item as listed |
| POST | `/api/items/:id/mark-sold` | requireAuth | Mark sold + create transaction |

### Meetings

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/meetings` | requireAuth | Get user's meetings |
| GET | `/api/requests/:id/meetings` | requireAuth | Get meetings for request |
| POST | `/api/requests/:id/meetings` | requireAuth | Schedule meeting |
| PATCH | `/api/meetings/:meetingId/cancel` | requireAuth | Cancel meeting |
| PATCH | `/api/meetings/:meetingId/reschedule` | requireAuth | Reschedule meeting |

### Messages

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/messages/conversations` | requireAuth | List conversations with unread counts |
| GET | `/api/messages/:userId` | requireAuth | Get messages with user (auto marks read) |
| POST | `/api/messages` | requireAuth | Send message |

### Notifications

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/notifications` | requireAuth | Get user's notifications |
| PATCH | `/api/notifications/:id/read` | requireAuth | Mark notification as read |

### Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/users` | requireAdmin | List all users with profiles |
| GET | `/api/admin/applications` | requireAdmin | List pending reusse applications |
| PATCH | `/api/admin/applications/:userId` | requireAdmin | Approve/reject reusse |
| GET | `/api/admin/stats` | requireAdmin | Platform statistics |

### Earnings

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/earnings` | requireAuth | Get earnings (80% seller / 20% reusse) |

### File Uploads (Object Storage)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/uploads/request-url` | No | Get presigned upload URL |
| GET | `/objects/*objectPath` | No | Serve uploaded file |

---

## Authentication

**Method:** Replit OIDC (OpenID Connect) via Passport.js
**Session store:** PostgreSQL (`sessions` table via connect-pg-simple)
**Session TTL:** 7 days
**Cookie:** httpOnly, secure, maxAge=7 days

**Auth middleware:**
- `isAuthenticated` — checks `req.user.claims.sub` exists and token not expired
- `requireAuth` — returns 401 if not authenticated
- `requireAdmin` — returns 403 if profile role !== "admin"

**Important:** This app uses Replit Auth exclusively. There is NO email/password registration. Users authenticate via Replit OAuth. If deploying outside Replit, the auth system must be replaced entirely.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption key |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | "development" or "production" |
| `ISSUER_URL` | No | OIDC issuer (default: "https://replit.com/oidc") |
| `REPL_ID` | Auto | Replit environment ID |
| `PUBLIC_OBJECT_SEARCH_PATHS` | For uploads | Comma-separated public bucket paths |
| `PRIVATE_OBJECT_DIR` | For uploads | Private bucket directory for uploads |

---

## IStorage Interface

All database operations go through `server/storage.ts`:

```typescript
interface IStorage {
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(data: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;

  // Requests
  getRequests(userId: string, role: string): Promise<Request[]>;
  getAvailableRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(data: InsertRequest): Promise<Request>;
  updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined>;
  acceptRequest(requestId: number, reusseId: string): Promise<Request | undefined>;

  // Items
  getItems(userId: string, role: string): Promise<Item[]>;
  getItemsByRequest(requestId: number): Promise<Item[]>;
  createItem(data: InsertItem): Promise<Item>;
  updateItem(id: number, data: Partial<Item>): Promise<Item | undefined>;

  // Meetings
  getMeetings(userId: string): Promise<Meeting[]>;
  getMeetingsByRequest(requestId: number): Promise<Meeting[]>;
  createMeeting(data: InsertMeeting): Promise<Meeting>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting>;

  // Messages
  getConversations(userId: string): Promise<any[]>;
  getMessagesBetween(userId: string, otherUserId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessagesRead(senderId: string, receiverId: string): Promise<void>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;

  // Admin
  getAllUsersWithProfiles(): Promise<any[]>;
  getPendingReusses(): Promise<any[]>;
  updateProfileStatus(userId: string, status: string): Promise<Profile | undefined>;
  getAdminStats(): Promise<any>;

  // Transactions & Earnings
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: string, role: string): Promise<Transaction[]>;
  getEarnings(userId: string, role: string): Promise<{ total: number; transactions: Transaction[] }>;
}
```

---

## File Upload Flow

1. **Client** calls `POST /api/uploads/request-url` with `{ name, size, contentType }`
2. **Server** generates a UUID path and presigned URL via GCS (15-minute TTL)
3. **Client** uploads file directly to presigned URL via `PUT`
4. **Client** stores the `objectPath` in the item's `photos[]` array
5. **Files served** via `GET /objects/<objectPath>`

Max 5 photos per item. Uses Uppy with AWS S3 plugin on the frontend.

---

## i18n

- **Languages:** English (`en`), French (`fr`)
- **Default:** French
- **Storage:** `localStorage` key `sellzy-lang`
- **Provider:** `I18nProvider` in `client/src/lib/i18n.tsx`
- **Hook:** `useI18n()` returns `{ t, language, setLanguage }`
- **Key count:** ~180 keys per language
- **Coverage:** All pages translated
- **Language switcher:** On landing page only (flag icons). Not yet in authenticated sidebar.

---

## Frontend Routing

| Path | Component | Auth | Role | Notes |
|------|-----------|------|------|-------|
| `/` | Landing or Dashboard | Conditional | Any | Landing if not logged in |
| `/dashboard` | Seller/Reusse/Admin Dashboard | Yes | Any | Role-based redirect |
| `/requests/new` | CreateRequestPage | Yes | Seller | 4-step wizard |
| `/requests/:id` | RequestDetailPage | Yes | Any | Items + meetings tabs |
| `/requests` | RequestsListPage | Yes | Any | User's requests |
| `/available` | RequestsListPage | Yes | Reusse | Available requests |
| `/items` | ItemsListPage | Yes | Any | With search + filter |
| `/messages` | MessagesPage | Yes | Any | Polling-based chat |
| `/profile` | ProfilePage | Yes | Any | Edit profile |
| `/schedule` | SchedulePage | Yes | Any | Meetings list |
| `/admin/*` | AdminDashboard | Yes | Admin | Users + applications |
| `/faq` | FaqPage | No | Any | Static |
| `/contact` | ContactPage | No | Any | Static (no backend) |
| `/terms` | TermsPage | No | Any | Static |
| `/privacy` | PrivacyPage | No | Any | Static |

**Conditional routing:**
- Not logged in → Landing + static pages
- Logged in, no profile → Onboarding
- Logged in, reusse with status "pending" → Pending review message
- Logged in, with profile → Role-appropriate dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 7 |
| Routing | wouter |
| State | TanStack React Query (staleTime: Infinity, no retry) |
| Forms | react-hook-form + zod |
| UI | shadcn/ui (40+ Radix components), Tailwind CSS 3 |
| Backend | Express 5, TypeScript, tsx |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | Replit Auth (Passport + OpenID Connect) |
| Storage | Replit Object Storage (GCS) |
| Uploads | Uppy + presigned URLs |
| Build | Vite (client) + esbuild (server) |

**Path aliases:**
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

---

## Hardcoded Values & Constants

| Value | Location | Description |
|-------|----------|-------------|
| 80% / 20% | `server/routes.ts` | Seller/Reusse earnings split |
| 5 photos | `client/src/pages/request-detail.tsx` | Max photos per item |
| 60 minutes | `shared/schema.ts` | Default meeting duration |
| 7 days | Auth config | Session TTL |
| 900 seconds | Object storage | Presigned URL TTL |
| Port 5000 | `.replit` + `server/index.ts` | Server port |
| `sellzy-lang` | `client/src/lib/i18n.tsx` | localStorage key for language |
| `fr` | `client/src/lib/i18n.tsx` | Default language |

---

## Known Gaps (as of 2026-03-09)

See `docs/` for original MVP plans. Current gaps tracked in Obsidian PRDs:

1. **Security:** No ownership checks on item/request mutations, no input validation
2. **Notification UI:** Backend creates notifications but no bell/badge/dropdown in frontend
3. **Messaging:** No way to initiate conversation from request detail, no identity display
4. **Workflows:** Counter-offer flow incomplete, no request editing, one-sided meeting scheduling
5. **Missing pages:** No earnings page, no settings page, no admin audit log

**Deferred to Phase 2:** Stripe payments, email notifications, WebSocket messaging, geographic matching, subscription tiers, custom authentication.

---

## Local Database Setup (Step-by-Step)

This guide explains how to set up the Sellzy database locally, including extracting data from an existing Replit deployment.

### Option A: Fresh Local Database

```bash
# 1. Install PostgreSQL 16 (macOS)
brew install postgresql@16
brew services start postgresql@16

# 2. Create database
createdb sellzy

# 3. Set connection string
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/sellzy"

# 4. Push schema (creates all tables from shared/schema.ts)
npm run db:push

# 5. Verify tables exist
psql sellzy -c "\dt"
# Expected: users, sessions, profiles, requests, items, meetings, messages, notifications, transactions
```

### Option B: Extract Database from Replit

If you have a running Replit deployment with data you want to migrate locally:

#### Step 1: Get the Replit DATABASE_URL

In your Replit project, open the Shell and run:

```bash
echo $DATABASE_URL
```

This will output something like:
```
postgresql://user:password@host:port/dbname
```

#### Step 2: Export the database

From the Replit Shell:

```bash
# Full database dump (schema + data)
pg_dump $DATABASE_URL --no-owner --no-privileges > sellzy_dump.sql

# Or compressed:
pg_dump $DATABASE_URL --no-owner --no-privileges | gzip > sellzy_dump.sql.gz
```

#### Step 3: Download the dump file

From the Replit file browser, download `sellzy_dump.sql` (or use the Replit CLI).

Alternatively, if you have SSH access or can use `curl` from Replit:

```bash
# From Replit shell — upload to a temporary file service or commit to repo
# WARNING: Do NOT commit database dumps with real user data to public repos
```

#### Step 4: Import locally

```bash
# 1. Create local database
createdb sellzy

# 2. Import the dump
psql sellzy < sellzy_dump.sql

# Or if compressed:
gunzip -c sellzy_dump.sql.gz | psql sellzy

# 3. Set local connection string
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/sellzy"

# 4. Verify
psql sellzy -c "SELECT count(*) FROM users;"
```

#### Step 5: Handle Replit-specific differences

The sessions table uses Replit Auth tokens that won't work locally. Clear stale sessions:

```bash
psql sellzy -c "DELETE FROM sessions;"
```

**Important:** Replit Auth (OIDC) will NOT work outside of Replit. To run locally, you'll need to either:
- Mock the auth middleware (replace `isAuthenticated` with a dev bypass)
- Implement a local auth strategy (JWT, basic auth, etc.)

### Option C: Schema-Only (No Data)

If you just need the database structure without any data:

```bash
# 1. Create database
createdb sellzy

# 2. Push Drizzle schema
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/sellzy"
npm run db:push

# 3. Optionally seed with test data (not yet implemented — see PRD security-authorization-fixes T-005)
# npm run db:seed
```

### Drizzle Studio (Visual DB Browser)

```bash
# Open Drizzle Studio to browse/edit data
npx drizzle-kit studio
```

### Connection Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` | PostgreSQL not running: `brew services start postgresql@16` |
| `database "sellzy" does not exist` | Create it: `createdb sellzy` |
| `role "X" does not exist` | Create role: `createuser -s $(whoami)` |
| `relation "X" does not exist` | Push schema: `npm run db:push` |
| `sessions table missing` | Push schema again — the sessions table is defined in `shared/schema.ts` |

### Important Notes

- This project uses **Drizzle push** (`db:push`), NOT migrations. There is no `migrations/` directory. Schema changes are pushed directly from `shared/schema.ts`.
- The `sessions` table MUST exist before starting the server (session store expects it).
- Replit Object Storage (file uploads) will NOT work locally. You'll need to mock `POST /api/uploads/request-url` or set up a local S3-compatible store.
- The auth system is tightly coupled to Replit. For local development, consider adding a `DEV_USER_ID` environment variable that bypasses auth in development mode.

---

## Build Process

### Development

```bash
npm run dev
# Runs: NODE_ENV=development tsx server/index.ts
# - Express server on port 5000
# - Vite dev server with HMR (hot module replacement)
# - TypeScript transpiled on-the-fly via tsx
# - Source maps enabled
```

### Production

```bash
npm run build
# 1. Cleans dist/
# 2. Vite builds client → dist/public/ (bundled, minified, hashed)
# 3. esbuild bundles server → dist/index.cjs (CommonJS, minified)

npm start
# Runs: NODE_ENV=production node dist/index.cjs
# - Serves static files from dist/public/
# - Falls back to index.html for SPA routing
# - No Vite, no HMR
```

---

## User Roles & Flows

### Seller Flow
1. Login → Onboarding (select "seller" role, fill contact info)
2. Dashboard → Create Request (4-step wizard)
3. Wait for Reusse match
4. Review items added by Reusse (approve/counter-offer/decline pricing)
5. Schedule meeting for item pickup
6. Track items through listing → sale
7. View earnings (80% of sale price)

### Reusse Flow
1. Login → Onboarding (select "reusse" role, fill professional details)
2. Wait for admin approval (status: "pending")
3. Once approved → Browse available requests
4. Accept request → Add items with photos and pricing
5. Schedule meeting with seller
6. List items on platforms → Mark as sold
7. View commission earnings (20% of sale price)

### Admin Flow
1. Login → Admin dashboard
2. Review and approve/reject Reusse applications
3. View platform statistics
4. View all users and their roles/statuses
