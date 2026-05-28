import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db";
import { users } from "../../shared/models/auth";
import { profiles } from "../../shared/schema";
import { sql } from "drizzle-orm";

describe("Auth Registration - Profile Creation", () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await db.execute(sql`DELETE FROM profiles WHERE user_id LIKE 'test-user-%'`);
    await db.execute(sql`DELETE FROM users WHERE id LIKE 'test-user-%'`);
  });

  it("should create a seller profile with 'approved' status", async () => {
    const userId = "test-user-seller-1";
    const email = `seller-${Date.now()}@test.com`;

    // Create user
    await db.execute(
      sql`INSERT INTO users (id, email) VALUES (${userId}, ${email})`
    );

    // Create profile with seller role
    const profile = await db.insert(profiles).values({
      userId,
      role: "seller",
      status: "approved",
      preferredContactMethod: "email",
    }).returning();

    expect(profile).toHaveLength(1);
    expect(profile[0].role).toBe("seller");
    expect(profile[0].status).toBe("approved");
    expect(profile[0].userId).toBe(userId);
  });

  it("should create a marchand profile with 'pending' status and legal fields", async () => {
    const userId = `test-user-marchand-${Date.now()}`;
    const email = `marchand-${Date.now()}@test.com`;

    // Create user
    await db.execute(
      sql`INSERT INTO users (id, email) VALUES (${userId}, ${email})`
    );

    // Create profile with marchand role and legal fields
    const profile = await db.insert(profiles).values({
      userId,
      role: "marchand",
      siretNumber: "12345678901234",
      vatNumber: "FR12345678901",
      dviNumber: "DVI123456",
      status: "pending",
      preferredContactMethod: "email",
    }).returning();

    expect(profile).toHaveLength(1);
    expect(profile[0].role).toBe("marchand");
    expect(profile[0].status).toBe("pending");
    expect(profile[0].siretNumber).toBe("12345678901234");
    expect(profile[0].vatNumber).toBe("FR12345678901");
    expect(profile[0].dviNumber).toBe("DVI123456");
  });

  it("should allow marchand to create profile without legal fields", async () => {
    const userId = `test-user-marchand-minimal-${Date.now()}`;
    const email = `marchand-minimal-${Date.now()}@test.com`;

    // Create user
    await db.execute(
      sql`INSERT INTO users (id, email) VALUES (${userId}, ${email})`
    );

    // Create marchand profile without legal fields
    const profile = await db.insert(profiles).values({
      userId,
      role: "marchand",
      status: "pending",
      preferredContactMethod: "email",
    }).returning();

    expect(profile).toHaveLength(1);
    expect(profile[0].role).toBe("marchand");
    expect(profile[0].status).toBe("pending");
    expect(profile[0].siretNumber).toBeNull();
    expect(profile[0].vatNumber).toBeNull();
    expect(profile[0].dviNumber).toBeNull();
  });
});
