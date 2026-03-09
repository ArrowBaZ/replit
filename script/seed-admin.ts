/**
 * Seed script to set a user as admin.
 *
 * Usage:
 *   npm run db:seed -- <USER_ID>
 *
 * Example:
 *   npm run db:seed -- abc123-def456
 *
 * This is idempotent — running it multiple times has no additional effect.
 */

import { db, pool } from "../server/db";
import { profiles } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const userId = process.argv[2];

  if (!userId) {
    console.error("Usage: npm run db:seed -- <USER_ID>");
    console.error("  Sets the specified user's profile role to 'admin'.");
    process.exit(1);
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (!profile) {
    console.error(`No profile found for user ID: ${userId}`);
    console.error("The user must log in and complete onboarding first.");
    process.exit(1);
  }

  if (profile.role === "admin") {
    console.log(`User ${userId} is already an admin.`);
    await pool.end();
    return;
  }

  await db
    .update(profiles)
    .set({ role: "admin", status: "approved", updatedAt: new Date() })
    .where(eq(profiles.userId, userId));

  console.log(`User ${userId} has been set as admin (was: ${profile.role}).`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
