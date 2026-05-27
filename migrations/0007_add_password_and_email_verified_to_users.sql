-- Add password_hash and email_verified columns for Auth.js integration
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "email_verified" TIMESTAMP;
