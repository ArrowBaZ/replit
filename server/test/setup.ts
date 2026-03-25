import { vi } from "vitest";

// Mock server/db.ts to prevent DATABASE_URL requirement in tests
vi.mock("../db", () => ({
  pool: {},
  db: {},
}));