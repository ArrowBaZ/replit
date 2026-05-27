---
tags: [copilot, brainstorm]
topic: Auth.js Migration - Email/Password Phase 1
date: 2026-05-27
feature_slug: authjs-migration-phase1
---

# Brainstorm: Auth.js Migration — Email/Password Phase 1

## What We're Building

Migrating from Replit OIDC authentication to Auth.js to enable email/password login initially, with OAuth provider infrastructure prepared for Phase 2. Users can sign up and access the full platform immediately without email validation. Profile data collection remains in the existing onboarding flow.

## Why This Approach

- **Simplicity**: Auth.js CredentialsProvider handles email/password without external OAuth dependencies
- **Speed**: No waiting for OAuth credentials—Phase 1 launches with email/password only
- **Minimal disruption**: PostgreSQL sessions remain unchanged; backend routing logic compatible
- **Clean Phase 2 handoff**: OAuth providers (Google, Microsoft, GitHub, etc.) configured but hidden until credentials are obtained
- **User experience**: Same signup-to-onboarding flow; email validation optional for now

## Key Decisions

1. **Provider Strategy**: Auth.js CredentialsProvider (email/password only in Phase 1)
   - OAuth providers configured in Auth.js but not exposed in UI
   - Ready to enable when company OAuth credentials are obtained

2. **Session Management**: Keep PostgreSQL sessions via `connect-pg-simple`
   - No migration to Auth.js Database adapter
   - 7-day TTL maintained
   - `sessions` table structure unchanged

3. **User Authentication Data**:
   - Add `password` column to `users` table (bcrypt-hashed)
   - Drop Replit OIDC-specific fields
   - Fresh start: delete all existing accounts

4. **Email Validation**: Optional (full app access without verified email)
   - Email address required for signup
   - Verification step prepared but not enforced
   - When email system is ready, can enforce validation without schema changes

5. **Signup Flow**: Minimal data collection
   - Signup: email + password only
   - Redirect: → existing onboarding (role selection, profile capture)
   - Onboarding unchanged

6. **Backward Compatibility**: Maintain `req.user.claims.sub` pattern
   - Auth.js `session.user.id` mapped to existing auth checks in routes
   - Minimal changes to protected route middleware

## Approaches Considered

### Approach 1: Auth.js + CredentialsProvider (CHOSEN)
- Email/password via CredentialsProvider
- OAuth providers configured dormant (Phase 2 activation)
- Keep PostgreSQL sessions
- **Pros**: Simple, fast, clean Phase 2 handoff, no external dependencies in Phase 1
- **Cons**: Must add OAuth later (but that's intentional)

### Approach 2: Auth.js + Database Adapter
- Auth.js manages all session/account tables
- Full Auth.js ecosystem integration
- **Pros**: Fully integrated, Auth.js handles session management
- **Cons**: Requires schema migration, unfamiliar session table structure, more Auth.js dependency

### Approach 3: Auth.js + JWT
- Stateless token-based auth
- No server-side session storage
- **Pros**: Scalable, modern
- **Cons**: Token refresh logic needed, loses familiarity with current session pattern, incompatible with current `connect-pg-simple` usage

**Rejected Approach 2 & 3** because Approach 1 aligns with your constraint to keep PostgreSQL sessions while enabling Phase 1 quickly.

## Constraints & Requirements

- **Phase 1 scope**: Email/password only, no OAuth UI
- **Email validation**: Optional (users can access full app without verified email)
- **Session storage**: PostgreSQL via `connect-pg-simple` (unchanged)
- **Session TTL**: 7 days
- **Fresh start**: Delete all existing user accounts
- **Signup**: Minimal (email + password) → onboarding
- **OAuth readiness**: Configured in Auth.js but hidden until company accounts exist
- **Backward compatibility**: Auth routes, middleware, and user object must remain compatible with existing code

## Open Questions

_None—all decisions confirmed._

## Success Criteria

- ✅ Users can sign up with email/password
- ✅ Email validation is optional (users access app without verified email)
- ✅ Users directed to onboarding after signup
- ✅ Protected routes enforce authentication (same middleware as today)
- ✅ Session storage uses PostgreSQL (existing pattern)
- ✅ OAuth providers configured in Auth.js (dormant, ready for Phase 2)
- ✅ No disruption to existing onboarding, profile, and dashboard flows
- ✅ All existing Replit OIDC code removed

## Next Steps

Run `/copilot-plan authjs-migration-phase1` to create the implementation plan with file-by-file changes, database migrations, and component updates.