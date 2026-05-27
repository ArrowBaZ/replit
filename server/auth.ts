import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PgAdapter } from "@auth/pg-adapter";
import { Pool } from "pg";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const signInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;

class InvalidLoginError extends Error {
  code = "Invalid email or password";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(pool),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        try {
          const { email, password } = await signInSchema.parseAsync(
            credentials
          );

          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (!user || !user.passwordHash) {
            throw new InvalidLoginError();
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            throw new InvalidLoginError();
          }

          return {
            id: user.id,
            email: user.email,
            name: user.firstName
              ? `${user.firstName} ${user.lastName || ""}`.trim()
              : undefined,
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            return null;
          }
          if (error instanceof InvalidLoginError) {
            throw new Error("Invalid email or password");
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
