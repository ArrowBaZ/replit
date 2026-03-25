---
title: "Vitest Test Infrastructure Setup for TypeScript + React 18 + Express 5"
date: 2026-03-13
category: "build-errors"
tags:
  - vitest
  - typescript
  - react-18
  - express-5
  - vite-7
  - drizzle-orm
  - supertest
  - testing-library
  - jsdom
  - mocking
  - coverage
severity: "foundation"
component: "test-infrastructure"
symptoms:
  - "Zero test coverage across entire codebase"
  - "No vitest configuration or test runner present"
  - "DATABASE_URL crash when importing server modules in test environment"
  - "Express app tightly coupled to HTTP server startup preventing supertest usage"
  - "Replit OpenID Connect auth middleware blocking route-level testing"
root_cause_type: "missing-infrastructure"
---

# Vitest Test Infrastructure Setup for TypeScript + React 18 + Express 5

Setting up Vitest 4.x test infrastructure from scratch in a full-stack TypeScript application using React 18 (client) and Express 5 (server) with Vite 7 as the build tool. The core challenge was establishing dual-environment testing — jsdom for React components and node for Express routes — within a single Vitest configuration.

## Root Cause Analysis

The project had four structural barriers to testability:

| Layer | Problem | Root Cause |
|-------|---------|------------|
| DB | Module-level `new Pool()` crashes without `DATABASE_URL` | `server/db.ts` creates connection at import time |
| Auth | Passport/OIDC initialization fails without live issuer | `setupAuth()` called inside `registerRoutes()` |
| Storage | Singleton import prevents per-test control | `export const storage = new DatabaseStorage()` at module level |
| Express | `listen()` called during import, blocking supertest | App setup and server startup in one procedural flow |

## Investigation Steps

1. Traced import graph: `server/index.ts` -> `routes.ts` -> `storage.ts` -> `db.ts` to identify the crash chain
2. Inspected `server/db.ts` — confirms top-level `new Pool({ connectionString: process.env.DATABASE_URL })` with throw guard
3. Inspected `server/routes.ts` — `setupAuth()` and `registerAuthRoutes()` called inside `registerRoutes()`
4. Checked `shared/schema.ts` — drizzle-zod schemas shared between client and server, testable independently
5. Reviewed `package.json` — zero test scripts, zero test dependencies
6. Confirmed Vitest `test.projects` API (replaces deprecated `workspace` in Vitest 3.2+)

## Solution

### 1. Dependencies

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom supertest @types/supertest
```

### 2. Vitest Config (`vitest.config.ts`)

Uses `test.projects` array (Vitest 3.2+/4.x). Do NOT use deprecated `vitest.workspace.ts`.

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      include: ["client/src/**/*.{ts,tsx}", "server/**/*.ts", "shared/**/*.ts"],
      exclude: ["**/*.test.*", "**/*.spec.*", "**/test/**", "**/dist/**", "**/*.config.*"],
      thresholds: {
        lines: 80, functions: 80, branches: 80, statements: 80,
        perFile: false, // global only — enable per-file once baseline reached
      },
    },
    projects: [
      {
        extends: true, // inherits React plugin for JSX transform
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(import.meta.dirname, "client", "src"),
            "@shared": path.resolve(import.meta.dirname, "shared"),
          },
        },
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/src/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["./client/src/test/setup.ts"],
        },
      },
      {
        resolve: {
          alias: { "@shared": path.resolve(import.meta.dirname, "shared") },
        },
        test: {
          name: "server",
          environment: "node",
          include: ["server/**/*.{test,spec}.ts", "shared/**/*.{test,spec}.ts"],
          setupFiles: ["./server/test/setup.ts"],
        },
      },
    ],
  },
});
```

Key decisions:
- `extends: true` on client inherits React plugin so JSX works in tests
- Server project does NOT extend (no React overhead)
- `shared/` tests run under server project (node env, pure logic)
- Path aliases replicate `vite.config.ts` to avoid "module not found"

### 3. Server Test Setup (`server/test/setup.ts`)

```typescript
import { vi } from "vitest";

// Prevent DATABASE_URL crash — must be in setupFiles (runs before imports)
vi.mock("../db", () => ({ pool: {}, db: {} }));
```

### 4. Client Test Setup (`client/src/test/setup.ts`)

```typescript
import "@testing-library/jest-dom/vitest";
```

### 5. Mock Storage Factory (`server/test/mock-storage.ts`)

```typescript
import { vi } from "vitest";
import type { IStorage } from "../storage";

export function createMockStorage(overrides?: Partial<Record<keyof IStorage, unknown>>): IStorage {
  const defaults: IStorage = {
    getProfile: vi.fn().mockResolvedValue(undefined),
    createProfile: vi.fn().mockResolvedValue({ id: 1 }),
    // ... all 27 methods with sensible defaults
  };
  return { ...defaults, ...overrides } as IStorage;
}
```

### 6. Auth Mocking (`server/test/auth-helper.ts`)

```typescript
import { vi } from "vitest";

let currentTestUser: { sub: string } | null = null;

export function mockAuth() {
  vi.mock("../replit_integrations/auth", () => ({
    setupAuth: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: (req: any, res: any, next: any) => {
      if (!currentTestUser) return res.status(401).json({ message: "Unauthorized" });
      req.isAuthenticated = () => true;
      req.user = { claims: currentTestUser, expires_at: Math.floor(Date.now() / 1000) + 3600 };
      next();
    },
    registerAuthRoutes: vi.fn(),
  }));
  vi.mock("../replit_integrations/object_storage/routes", () => ({
    registerObjectStorageRoutes: vi.fn(),
  }));
}

export function setTestUser(userId: string) { currentTestUser = { sub: userId }; }
export function clearTestUser() { currentTestUser = null; }
```

### 7. App Extraction (`server/app.ts`)

```typescript
import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  // logging middleware...
  await registerRoutes(httpServer, app);
  // error handler...
  return { app, httpServer };
}
```

Then `server/index.ts` becomes: `const { httpServer } = await createApp(); httpServer.listen(PORT);`

### 8. Package Scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:client": "vitest --project client",
  "test:server": "vitest --project server"
}
```

## Prevention Strategies

### Pitfalls to Avoid in Future Projects

| Pitfall | Prevention |
|---------|-----------|
| Vitest workspace API deprecated (3.2+) | Use `test.projects` array, check `npx vitest --version` first |
| Module throws on import without env var | Wrap DB init in lazy factory, or mock in `setupFiles` |
| Auth requires live OIDC config | Mock entire auth module — never let tests reach real network calls |
| App + server coupled | **Always** separate `createApp()` from `listen()` from day one |
| Storage singleton | Use `vi.mock('./storage')` with factory; long-term consider DI |
| Path aliases not in test config | Share alias object between `vite.config.ts` and `vitest.config.ts` |
| Platform plugins crash outside platform | Conditional loading: `process.env.REPL_ID ? [plugin()] : []` |
| 80% threshold on empty codebase | Start with global thresholds, `perFile: false`, ratchet up |

### Best Practices Checklist

- [ ] Separate app creation from server startup
- [ ] Mock at boundaries (DB, auth, external APIs) at module level
- [ ] Set env vars in setup files before any module loads
- [ ] Match path aliases across tsconfig, vite config, vitest config
- [ ] Conditional platform-specific plugins
- [ ] Start permissive thresholds, tighten progressively
- [ ] One smoke test per project area to validate setup
- [ ] Pin tool versions to avoid silent breaking changes

### Validation Test Matrix

| # | Test | Expected |
|---|------|----------|
| 1 | `npx vitest run` | Exit 0, no config errors |
| 2 | Client test with `document.createElement` | Passes (jsdom works) |
| 3 | Server test with `import http` | Passes (node env works) |
| 4 | Import from `@/` in client test | No module resolution error |
| 5 | Import from `@shared/` in server test | No module resolution error |
| 6 | Import module that transitively uses `db.ts` | No DATABASE_URL crash |
| 7 | Import route with `requireAuth` | No OIDC discovery error |
| 8 | `import { createApp } from './app'` | No `.listen()` side effect |
| 9 | `request(app).get('/api/...')` via supertest | Response received |
| 10 | `npx vitest run --coverage` | Coverage report generated, exit 0 |

## Related Documents

- `AGENTS.md` — Full project architecture, IStorage interface (27 methods), all 31 API routes, auth middleware chain
- `server/storage.ts` — IStorage interface definition (primary mock target)
- `server/routes.ts:8-91` — Zod validation schemas and auth middleware (`requireAuth`, `requireAdmin`)
- `server/replit_integrations/auth/replitAuth.ts` — Replit OIDC + Passport auth implementation
- `server/db.ts` — Database connection (the module that crashes without DATABASE_URL)
- `vite.config.ts` — Path aliases and conditional Replit plugin loading
- `Copilot/replit/prd/unit-test-infrastructure.md` — Full PRD with 12 tasks (Obsidian)