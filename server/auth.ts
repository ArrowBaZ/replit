import { z } from "zod";
import bcrypt from "bcrypt";

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

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileType: z.enum(["seller", "marchand"], { required_error: "Profile type is required" }),
  siretNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  dviNumber: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

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
