import { vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

/**
 * Mock the Replit auth integration module.
 * Call this at the top of test files that test authenticated routes.
 *
 * Usage:
 *   mockAuth();
 *   // then in tests:
 *   setTestUser("user-123");
 */

let currentTestUser: { sub: string } | null = null;

export function mockAuth() {
  vi.mock("../replit_integrations/auth", () => ({
    setupAuth: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: (req: any, res: Response, next: NextFunction) => {
      if (!currentTestUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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

/**
 * Set the authenticated user for subsequent requests.
 * Pass null to simulate unauthenticated state.
 */
export function setTestUser(userId: string | null) {
  currentTestUser = userId ? { sub: userId } : null;
}

/**
 * Clear the test user (unauthenticated state).
 */
export function clearTestUser() {
  currentTestUser = null;
}
