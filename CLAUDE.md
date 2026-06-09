# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sellzy** is a fashion resale marketplace connecting sellers with expert resellers (Marchands). The platform handles item listings, negotiations, agreements, and transactions with tiered commission structures.

**Key Stack:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Express 5 + TypeScript  
- Database: PostgreSQL with Drizzle ORM (exclusive ORM—no Prisma)
- Routing: wouter (client-side), Express (server)
- Styling: Tailwind CSS + shadcn/ui
- Auth: Passport.js with email/password authentication

## Quick Start Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (client + API on port 5000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:client` | Run client tests only |
| `npm run test:server` | Run server/shared tests only |
| `npm run docker:up` | Start PostgreSQL via Docker (requires Orbstack) |
| `npm run db:push` | Sync Drizzle schema to database |
| `npm run db:seed` | Seed with test data (idempotent) |
| `npm run docker:reset` | Drop DB, recreate, and seed fresh |

### Running a Single Test

```bash
# Watch mode (pattern match)
npx vitest client/src/components/__tests__/MyComponent.test.tsx

# Run once
npx vitest run server/api.test.ts

# By project
npx vitest --project server run server/test.ts
```

## Project Architecture

### Three-Layer Structure

```
client/        → React frontend (SPA)
server/        → Express API + business logic
shared/        → Schema, types, constants (used by both)
```

### Data Flow

1. **Frontend (React)** → Uses TanStack React Query to fetch from `/api/*` endpoints
2. **Backend (Express)** → Routes in `server/routes.ts`, delegates to `server/storage.ts`
3. **Storage Layer** → `server/storage.ts` implements `IStorage` interface; all DB queries go through here
4. **Database** → PostgreSQL with Drizzle ORM; schema in `shared/schema.ts`

### Key Directories

#### `client/src/`
- `pages/` — Page components (one per route): dashboard, requests, items, messages, etc.
- `components/` — Reusable React components (shadcn/ui + custom)
- `hooks/` — Custom React hooks (`use-auth`, `useQuery`, etc.)
- `lib/` — Utilities: query client, i18n config, API client setup
- `test/` — Test setup and helpers

#### `server/`
- `routes.ts` — All API endpoints (31 total); request handlers that call storage layer
- `storage.ts` — Core data access layer; implements `IStorage` interface with methods for all entities
- `auth.ts` — Password hashing and verification (bcrypt)
- `email.ts` — Email service for agreements and notifications
- `pdf.ts` — PDF generation (jsPDF) for agreements
- `app.ts` — Express app setup, middleware, error handling
- `db.ts` — Drizzle client initialization
- `index.ts` — Server entry point
- `test/` — Integration test setup

#### `shared/`
- `schema.ts` — **Single source of truth** for all database tables (users, profiles, requests, items, meetings, messages, notifications, transactions, etc.) and Zod schemas
- `constants.ts` — App constants (item categories, conditions, notification keys, etc.)
- `models/auth.ts` — Auth-related database table definitions

### Database Schema (Drizzle ORM)

The entire schema lives in `shared/schema.ts`. Key tables:

- **users** — Authentication (email, password hash, firstName, lastName, role)
- **profiles** — Extended user info (role: seller/marchand/admin, status, IBAN, etc.)
- **requests** — Seller requests (what items are needed)
- **items** — Products (title, category, condition, prices, approval status)
- **meetings** — Scheduled meetings between buyer/seller
- **messages** — Chat messages between users
- **notifications** — User notifications with preferences
- **transactions** — Financial transactions (payments, commissions)
- **agreements** — Formal agreements between seller/marchand for item bundles
- **itemDocuments** — Supporting documents for items (condition photos, certification)
- **feeTiers** — Commission split rules by price range (seller%, marchand%, platform%)

**No Migrations:** Uses Drizzle `push` (direct schema sync), not migrations. Run `npm run db:push` after schema changes.

### API Architecture

All routes registered in `server/routes.ts`. Pattern:

```typescript
// POST /api/items
app.post("/api/items", requireAuth, async (req: AuthRequest, res) => {
  const validated = createItemSchema.parse(req.body);
  const item = await storage.createItem({ ...validated, userId: req.user!.id });
  res.json(item);
});
```

**Key Patterns:**
- Endpoints use `requireAuth` middleware for protected routes
- All request bodies validated with Zod schemas
- All responses are JSON
- Storage layer handles all DB operations; routes only orchestrate

### Frontend Patterns

#### Page Components
Live in `client/src/pages/`. Each page:
- Uses `useQuery` from React Query to fetch data
- Routes to other pages via `useLocation` from wouter
- Manages local state for forms (react-hook-form)
- Displays data with shadcn/ui components

#### Common Hook Pattern
```typescript
const { data: items, isLoading } = useQuery({
  queryKey: ["/api/items"],
});
```

#### Routing
wouter handles client-side routing. Routes defined in `App.tsx`:
```typescript
<Route path="/requests" component={RequestsListPage} />
<Route path="/request/:id" component={RequestDetailPage} />
```

### Authentication

Uses **email/password** authentication with Passport.js (local strategy). Session stored in PostgreSQL via `connect-pg-simple`.

- Login/signup via `/api/auth/login` and `/api/auth/register`
- Session management: stored in DB, checked on each request
- Protected routes use `requireAuth` middleware
- User ID available on `req.user.id` in authenticated routes

### Key Patterns & Conventions

#### Storage Layer
- All database operations go through `server/storage.ts`
- Implements `IStorage` interface—add new methods there
- Methods return typed Drizzle ORM results
- Example: `getItems(userId, role)` returns array of `Item[]`

#### Validation
- Zod schemas defined in `shared/schema.ts`
- Use `.parse()` in routes for request validation
- Zod errors return 400 status via Express error handler

#### Error Handling
- Express error handler in `app.ts` catches all errors
- Returns JSON with status code and message
- Include statusCode or status property on Error objects for custom codes

#### Transactions & Fee Logic
- `resolveFeePercentages(price)` in `routes.ts` looks up fee tier for a price
- Returns seller%, marchand%, platform% split
- Fee tiers configured via admin in `/api/admin/fee-tiers`
- Used when approving items and creating agreements

#### WebSocket (Optional)
- Initialized in `registerRoutes` if needed
- Used for real-time features (notifications, chat)
- Example in routes.ts shows pattern

#### File Uploads
- Uses Uppy client + AWS S3 integration
- Routes for upload endpoints in `replit_integrations/object_storage`
- Google Cloud Storage available for Replit environment

### Testing

**Framework:** Vitest with React Testing Library (client) and Supertest (server)

**Coverage Thresholds:** 80% (lines, functions, branches, statements)

**Excluded from Coverage:**
- `server/vite.ts`, `server/index.ts`, `server/static.ts`, `server/db.ts` (bootstrap files)
- All `*.config.ts` files
- Test files themselves

**Example Server Test (Integration):**
```typescript
describe("POST /api/items", () => {
  it("creates an item", async () => {
    const res = await request(app)
      .post("/api/items")
      .set("Cookie", `session=${sessionId}`)
      .send({ title: "Jacket", category: "outerwear" });
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});
```

### Build & Deployment

**Development:**
- `npm run dev` runs Vite dev server + Express server simultaneously
- Hot reload for client code
- Changes to backend require manual restart (or use supervisor tool)

**Production Build:**
```bash
npm run build      # Builds Vite output to dist/public + esbuild server to dist/index.cjs
npm run start      # Runs dist/index.cjs (must build first)
```

**Environment Variables:**
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — 32-char hex string for session encryption (required)
- `PORT` — Server port (default 5000)
- `NODE_ENV` — "development" or "production"

### Special Considerations

#### Drizzle Push (Not Migrations)
- Edit `shared/schema.ts` → run `npm run db:push`
- No migrations directory; schema is version-controlled
- Safer for small teams; less ceremony than migrations

#### i18next Internationalization
- Configured in `client/src/lib/i18next.config.ts`
- French translations available
- Add new translation keys to `i18n/locales/fr.json`

#### Admin Features
- Admin dashboard at `/admin` requires `role === "admin"` on profile
- Admin can manage fee tiers, view all requests, approve/reject items
- Admin-specific routes checked in `routes.ts`

#### Email Sending
- Uses transporter setup in `server/email.ts`
- Currently configured for SendGrid (update credentials in `.env`)
- Agreements send emails to seller + marchand when created

#### Commission Structure
- Three-tier system: low price → high price ranges
- Each tier has seller%, marchand%, platform% split
- Configured in admin fee tiers page
- Totals must sum to 100% per tier

## Debugging Tips

**Port Issues:** Only port 5000 is open in Replit. Don't change it.

**Database Connection:** Verify `DATABASE_URL` is set and PostgreSQL is running (`docker:up` or native).

**Test Failures:** Check test file lives in correct location:
- Client: `client/src/**/*.{test,spec}.{ts,tsx}`
- Server: `server/**/*.{test,spec}.ts` or `shared/**/*.{test,spec}.ts`

**Type Errors:** Run `npm run check` to see all TypeScript errors before committing.

**Session Issues:** Session stored in `sessions` table in PostgreSQL. Restart server to clear stale sessions.
