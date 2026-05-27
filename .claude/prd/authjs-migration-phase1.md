---
tags: [copilot, prd]
feature: authjs-migration-phase1
status: active
date: 2026-05-27
type: feat
origin: brainstorms/2026-05-27-authjs-migration-phase1.md
---

# Auth.js Migration — Email/Password Phase 1

## Overview

Replace Replit OIDC authentication system with Auth.js using CredentialsProvider for email/password authentication. Users can sign up with email + password, access the full platform immediately (email validation optional), and proceed to existing onboarding. OAuth providers (Google, Microsoft, GitHub, etc.) will be configured but hidden in Phase 1, ready for activation when company OAuth credentials are obtained.

## Problem Statement / Motivation

**Current State:**
- Authentication tightly coupled to Replit OIDC via `openid-client` library
- Only works within Replit environment; not portable to other platforms
- Requires Replit account for all users; no alternative login methods
- No visibility into roadmap for Replit OIDC long-term support

**Desired State:**
- Self-hosted, portable authentication system
- Email/password option for users without external accounts
- Foundation for future social login (Google, Microsoft, GitHub)
- Full control over user data and auth flow

**Why Auth.js?**
- Industry standard (used by Vercel, Stripe, etc.)
- Minimal setup for CredentialsProvider (email/password)
- Clean migration path to OAuth providers
- Strong TypeScript support
- Session management compatible with current PostgreSQL setup

## Proposed Solution

**Phase 1 Implementation:**
1. Add `passwordHash` column to `users` table (bcrypt-hashed passwords)
2. Install Auth.js + CredentialsProvider
3. Configure Auth.js with PostgreSQL session adapter
4. Create `/api/auth/[...nextauth]` handler
5. Implement registration endpoint (`POST /api/auth/register`)
6. Create signup/login form component
7. Update `useAuth` hook to use Auth.js session
8. Update route guards (same middleware pattern)
9. Remove all Replit OIDC code
10. Delete existing user accounts (fresh start)

**What Doesn't Change:**
- Onboarding flow (role selection, profile capture)
- Session TTL (7 days)
- Protected route middleware logic (`isAuthenticated`, `requireAuth`)
- Database structure (tables, foreign keys)
- API response formats

**Phase 2 (Deferred):**
- OAuth provider UI + configuration
- Email verification enforcement
- Password reset flow
- Multi-factor authentication

## Technical Considerations

### Session Strategy: PostgreSQL (not JWT)
- **Why PostgreSQL?** Sessions can be revoked immediately; server-side control; compatible with current `connect-pg-simple` usage.
- **Auth.js Session Adapter:** Uses `@auth/pg-adapter` to manage `sessions` table (auto-created).
- **TTL:** 30 days (Auth.js default); can adjust in config.
- **No conflict:** Existing `sessions` table will be replaced by adapter; no manual schema management needed.

### Password Hashing: Bcrypt
- **Cost factor:** 12 (industry standard; ~100ms per hash)
- **Library:** `bcrypt` npm package
- **Hash before storage:** Never store plaintext passwords
- **Timing-safe comparison:** Always use `bcrypt.compare()` in auth logic

### Type Safety
- Extend `NextAuth.Session` and `NextAuth.User` interfaces in `types/next-auth.d.ts`
- Ensure `session.user.id` exists for all protected routes
- Maintain backward compatibility with `req.user.claims.sub` → `req.user.id` mapping

### Email Validation
- **Phase 1:** Optional (users can access app without verified email)
- **Implementation:** Add `emailVerified` column (nullable timestamp)
- **Future enforcement:** Simple middleware update to check `emailVerified !== null`

### CSRF Protection
- **Built-in:** Auth.js automatically handles CSRF tokens
- **No manual handling:** Forms using `signIn()` server action are protected automatically

## System-Wide Impact

### Interaction Graph
When a user signs up or logs in:
1. Form submission → `signIn()` server action
2. Auth.js validates credentials (bcrypt comparison)
3. Session created in PostgreSQL
4. Session cookie sent to client
5. Middleware on protected routes checks session validity
6. `useAuth` hook fetches `/api/auth/session` and caches user data
7. Frontend renders authenticated UI

### Error Propagation
- **Invalid credentials:** Throw `CredentialsSignin` error → user sees "Invalid email or password"
- **Database error:** Catch and log; return generic error to client (don't expose DB details)
- **Validation error:** Zod validation failure → return 400 with detailed field errors (for signup)

### State Lifecycle Risks
- **Orphaned sessions:** If user deleted mid-session, Auth.js cascade delete removes sessions automatically
- **Concurrent signups:** Email uniqueness constraint prevents duplicate accounts
- **Session invalidation:** Logout immediately removes session from database (revocable)

### API Surface Parity
**Endpoints that change:**
- `POST /api/auth/signin` — New Auth.js endpoint (replaces `/api/login`)
- `POST /api/auth/signout` — New Auth.js endpoint (replaces `/api/logout`)
- `GET /api/auth/session` — New Auth.js endpoint (use instead of `/api/auth/user`)
- `POST /api/auth/register` — New, registration endpoint

**Endpoints that stay compatible:**
- `GET /api/profile` — Uses `req.user.id` (same as before, just sourced from session)
- `PATCH /api/profile` — Same interface
- All dashboard/data endpoints — No changes

### Middleware Changes
**Current:**
```typescript
app.get("/api/data", isAuthenticated, requireAuth, async (req: any, res) => {
  const userId = req.user.claims.sub;
  // ...
});
```

**After Auth.js:**
```typescript
app.get("/api/data", isAuthenticated, requireAuth, async (req: any, res) => {
  const userId = req.user.id; // Changed: auth adapter provides .id directly
  // ...
});
```

Alternative (minimal change):
```typescript
// In Auth.js callback: map id to claims.sub for backward compatibility
callbacks: {
  session({ session, user }) {
    session.user.claims = { sub: user.id };
    return session;
  },
},
```

## Success Metrics

- ✅ Users can sign up with email + password
- ✅ Email validation is optional (users access app without verified email)
- ✅ Users directed to onboarding after signup
- ✅ Protected routes enforce authentication (same middleware as today)
- ✅ Session stored in PostgreSQL (7-day expiry)
- ✅ OAuth providers configured in Auth.js config (dormant)
- ✅ No disruption to existing onboarding, profile, dashboard flows
- ✅ All Replit OIDC code removed
- ✅ Existing user accounts deleted (fresh start)
- ✅ Password complexity: 8-32 characters (no special char requirement)

## Dependencies & Risks

### Dependencies
- **Auth.js** (`next-auth@latest`) — Core auth library
- **@auth/pg-adapter** — PostgreSQL session adapter
- **bcrypt** — Password hashing
- **Zod** — Input validation (already installed)

### Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Data loss during migration | High | Test migration in staging; backup database before running |
| Session incompatibility | Medium | Auth.js adapter auto-creates correct schema; test session creation before deployment |
| Password reset before system ready | Medium | Don't release password reset in Phase 1; add in Phase 2 |
| Brute force attacks | Medium | Implement rate limiting (Upstash Redis or local memory) on register/signin |
| User can't recover account | High | Prepare password reset flow for Phase 2; document manual recovery for Phase 1 |
| Email verification enforcement too early | Low | Schema supports optional `emailVerified`; update middleware in Phase 2 |

## Tasks

| ID | Title | Description | Acceptance Criteria | Priority | Effort |
|---|---|---|---|---|---|
| T-001 | Remove Replit OIDC code | Delete `/server/replit_integrations/auth/` folder and all imports | - Folder deleted<br>- No imports reference Replit auth in any files<br>- `package.json` no longer has `openid-client` (can remove it)<br>- Server starts without errors | 1 | 1h |
| T-002 | Add password column to users table | Create migration to add `passwordHash` column (nullable for now, become required) | - Migration file created<br>- `passwordHash TEXT` column added<br>- Migration runs without errors<br>- Existing users have NULL passwordHash | 1 | 30m |
| T-003 | Install and configure Auth.js | Install `next-auth@latest`, `@auth/pg-adapter`, `bcrypt` and create `auth.ts` config file | - All packages installed<br>- `/server/auth.ts` created with CredentialsProvider<br>- PostgreSQL adapter configured<br>- Session strategy set to "database"<br>- Credentials schema validates email + password | 1 | 1h |
| T-004 | Create Auth.js route handler | Create `/api/auth/[...nextauth].ts` to handle Auth.js flows | - Route file created<br>- Handles POST `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`<br>- Returns 200 status<br>- Server logs show auth endpoints working | 1 | 30m |
| T-005 | Implement registration endpoint | Create `POST /api/auth/register` endpoint for email + password signup | - Endpoint accepts `{ email, password, confirmPassword }`<br>- Validates email uniqueness<br>- Hashes password with bcrypt<br>- Creates user in database<br>- Returns 201 + user object (no passwordHash)<br>- Validation errors return 400 with field errors | 1 | 1h |
| T-006 | Create signup form component | Build React form component for email + password signup | - Form inputs for email, password, confirm password<br>- Client-side validation (email format, password match)<br>- Submit calls `POST /api/auth/register`<br>- Shows validation errors<br>- Shows loading state<br>- Redirects to onboarding on success | 1 | 1.5h |
| T-007 | Create login form component | Build React form component for email + password login | - Form inputs for email + password<br>- Submit calls `signIn("credentials", { email, password })`<br>- Shows error message on failure<br>- Shows loading state<br>- Redirects to dashboard on success<br>- "Forgot password" link (no functionality yet) | 1 | 1h |
| T-008 | Update useAuth hook | Refactor `/client/src/hooks/use-auth.ts` to use Auth.js session | - Hook calls `useSession()` from Auth.js<br>- Returns `{ user, status, logout }`<br>- `logout` calls `signOut()`<br>- Works with `/api/auth/session` endpoint | 1 | 45m |
| T-009 | Update route protection middleware | Update `isAuthenticated` and `requireAuth` to work with Auth.js session | - `isAuthenticated` checks `req.user?.id` (from Auth.js)<br>- `requireAuth` validates user object exists<br>- All protected routes still enforce auth<br>- Tests pass: auth tests, route tests | 1 | 1h |
| T-010 | Update App routing logic | Refactor `/client/src/App.tsx` to conditionally render authenticated vs public UI | - Uses `useAuth()` to check authentication<br>- Shows loading state while checking session<br>- Unauthenticated users see landing page<br>- Authenticated users see dashboard<br>- Onboarding check still works (no profile → show onboarding) | 2 | 1h |
| T-011 | Create login page UI | Build `/client/src/pages/login.tsx` page with login form | - Page has email + password form<br>- Form uses login component from T-007<br>- Page accessible at `/login`<br>- Unauthenticated users redirected here<br>- Shows "Sign up" link to register page | 2 | 45m |
| T-012 | Create register page UI | Build `/client/src/pages/register.tsx` page with signup form | - Page has email + password + confirm password form<br>- Form uses signup component from T-006<br>- Page accessible at `/register`<br>- Shows "Already have an account?" link to login<br>- Creates user account on submission | 2 | 45m |
| T-013 | TypeScript auth type definitions | Create `/types/next-auth.d.ts` to extend Session and User types | - File created with `@types/next-auth` module declarations<br>- `Session.user` includes `id` and `email`<br>- `User` interface matches schema (id, email, name, emailVerified)<br>- TypeScript compilation succeeds | 2 | 30m |
| T-014 | Delete existing user accounts | Clear all existing Replit auth users from database | - All users deleted from `users` table<br>- All sessions cleared<br>- Database has no user data (fresh start)<br>- Only system tables remain (migrations metadata, etc.) | 1 | 15m |
| T-015 | Test end-to-end signup → login flow | Verify complete signup and login experience works | - Register new user<br>- Receive no errors<br>- Can login with same email/password<br>- Session created in database<br>- Redirects to onboarding<br>- Protected routes enforce auth | 1 | 1h |

## Sources

- **Brainstorm:** `brainstorms/2026-05-27-authjs-migration-phase1.md` — All Phase 1 decisions
- **Repo Research:** Current auth patterns from `/server/replit_integrations/auth/` and `/client/src/hooks/use-auth.ts`
- **Auth.js Documentation:** CredentialsProvider setup, PostgreSQL adapter, session configuration
- **Best Practices:** Bcrypt hashing, input validation with Zod, error handling patterns
- **CLAUDE.md Conventions:** No explicit auth patterns in user CLAUDE.md; following repo defaults
