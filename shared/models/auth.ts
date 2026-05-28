import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: varchar("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    code: varchar("code", { length: 6 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => [
    index("idx_verification_user_id").on(table.userId),
    index("idx_verification_code").on(table.code),
    index("idx_verification_expires_at").on(table.expiresAt),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),
    token: varchar("token", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("idx_reset_userId").on(table.userId),
    index("idx_reset_token").on(table.token),
    index("idx_reset_expiresAt").on(table.expiresAt),
  ]
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
