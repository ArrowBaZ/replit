import { vi } from "vitest";

/**
 * Setup test auth user.
 * Call this at the top of test files that test authenticated routes.
 *
 * Usage:
 *   setTestUser("user-123");
 *   // request.user.id will be "user-123" in your route handlers
 */

let currentTestUser: { id: string; email: string } | null = null;

export function mockAuth() {
  vi.mock("../replit_integrations/object_storage/routes", () => ({
    registerObjectStorageRoutes: vi.fn(),
  }));
}

/**
 * Set the authenticated user for subsequent requests.
 * Pass null to simulate unauthenticated state.
 */
export function setTestUser(userId: string | null, email: string = "test@example.com") {
  currentTestUser = userId ? { id: userId, email } : null;
}

/**
 * Get the current test user object.
 */
export function getTestUser() {
  return currentTestUser;
}

/**
 * Clear the test user (unauthenticated state).
 */
export function clearTestUser() {
  currentTestUser = null;
}
