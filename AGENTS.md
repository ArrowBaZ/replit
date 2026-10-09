# Sellzy: Agent and Developer Context

Sellzy is a fashion resale marketplace that connects sellers with expert resellers ("Reusses", stored as `marchand` in newer code). This file is the shared project context. `CLAUDE.md` imports it and adds Claude-specific rules.

Detailed references (schema, endpoints, storage interface) live in [`docs/reference/codebase-reference.md`](docs/reference/codebase-reference.md). That file is a 2026-03 snapshot and may be out of date; check the code before relying on it.

## Stack

- Frontend: React 18, TypeScript, Vite, wouter, TanStack Query, shadcn/ui, Tailwind CSS, i18next
- Backend: Express 5, TypeScript (run with tsx in dev, esbuild bundle in prod)
- Database: PostgreSQL 16 with Drizzle ORM (the only ORM)
- Tests: Vitest, React Testing Library, Supertest

## Commands

| Task | Command |
|------|---------|
| Dev server (client and API, port 5000) | `npm run dev` |
| Type check | `npm run check` |
| Build | `npm run build` |
| Production start | `npm run start` |
| Tests | `npm run test:run` (one-shot), `npm run test` (watch) |
| Push schema to database | `npm run db:push` |
| Seed test data | `npm run db:seed` |
| Make a user admin | `npm run db:seed:admin -- <USER_ID>` |
| Local Postgres in Docker | `npm run docker:up`, `npm run docker:reset` |

Setup steps are in the root [README.md](README.md) and [docs/setup/](docs/setup/).

## Layout

```
client/src/
  pages/          one component per route
  components/     shared UI, shadcn/ui primitives in ui/
  hooks/          use-auth, use-upload, use-toast, use-mobile
  lib/            i18next.config.ts, queryClient.ts, auth-*.ts, notification-translator.ts
  assets/         logos imported through the @/ alias
server/
  index.ts        entry point
  routes.ts       all /api endpoints
  storage.ts      IStorage interface and its Drizzle implementation (the only DB access layer)
  auth.ts         password hashing (bcrypt)
  email.ts        transactional email
  pdf.ts          agreement PDFs (jsPDF)
  seed.ts         demo data (db:seed)
  replit_integrations/object_storage/   file upload backend
shared/
  schema.ts       Drizzle tables and Zod schemas, single source of truth
  constants.ts    categories, statuses, roles, service types
  models/auth.ts  auth-related tables
locales/          en.json and fr.json (kept in sync)
scripts/          build, seeding, Docker setup, export helpers
docs/             product specs, analyses, setup guides, history
```

Path aliases: `@/*` maps to `client/src/*`, `@shared/*` maps to `shared/*`.

## Conventions

- Routes orchestrate. Every database call goes through `server/storage.ts` (`IStorage`).
- Request bodies are validated with Zod schemas from `shared/schema.ts`.
- Errors: the Express handler in `server/app.ts` returns JSON. Set `statusCode` or `status` on an Error to control the code.
- Schema changes: edit `shared/schema.ts`, then run `npm run db:push`. The project uses push, not migrations.
- Every user-facing string goes through i18next. Keep `locales/en.json` and `locales/fr.json` with identical keys. Check with:
  `diff <(jq -r 'keys[]' locales/en.json | sort) <(jq -r 'keys[]' locales/fr.json | sort)`
- Fallback language is English. Supported languages are English and French.

## Authentication

Completed. Sign-in no longer depends on Replit. The plan is in [`docs/product/authjs-migration-phase1.md`](docs/product/authjs-migration-phase1.md) (status: completed).

- Registration and sign-in use email and password, with bcrypt hashing (`server/auth.ts`).
- Email verification uses one-time codes. Password reset uses tokens.
- Sessions live in the `sessions` table. The cookie name `next-auth.session-token` is kept from the Auth.js phase. The `next-auth` package is not imported anywhere and is a removal candidate.
- Auth routes are under `/api/auth/*`. Rate limiters apply to sign-in, registration, verification, and reset.

## Data

- No data snapshot is kept in the repo. `npm run db:seed` inserts demo data.
- `npm run db:push` creates the schema from `shared/schema.ts`. No migration files are kept.
- Prisma packages appear in the lockfile but are not used. Drizzle is the only ORM. Details in [`replit.md`](replit.md).
- Commission splits come from fee tiers. `resolveFeePercentages` in `server/routes.ts` looks up the tier for a price. Tiers are edited in the admin area.

## Testing

- Client tests: `client/src/**/*.{test,spec}.{ts,tsx}` (jsdom).
- Server tests: `server/**/*.{test,spec}.ts` and `shared/**/*.{test,spec}.ts`. These need a running database.
- Coverage target is 80% for lines, functions, branches, and statements.

## Working rules for agents

- Read the code before asserting how something works. Several docs in this repo are out of date.
- Keep changes small and in the layer they belong to: schema, storage, routes, then UI.
- Run `npm run check` before finishing. Some errors already exist in the client; do not add new ones.
- Do not edit `dist/`, `node_modules/`, or the lockfile by hand.
