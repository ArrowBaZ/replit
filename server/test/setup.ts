import { vi } from "vitest";

// Mock server/db.ts for unit tests. Integration tests (seed, auth) use the real
// database when DATABASE_URL is set in .env, so the mock only applies without it.
vi.mock("../db", async (importOriginal) => {
  const { config } = await import("dotenv");
  config();
  if (process.env.DATABASE_URL) return importOriginal();
  return { pool: {}, db: {} };
});