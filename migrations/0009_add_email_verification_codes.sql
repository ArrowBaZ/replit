-- Email verification codes table for storing temporary verification codes
CREATE TABLE "email_verification_codes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" VARCHAR(6) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP NOT NULL,
  "verified_at" TIMESTAMP
);

CREATE INDEX "idx_verification_user_id" ON "email_verification_codes"("user_id");
CREATE INDEX "idx_verification_code" ON "email_verification_codes"("code");
CREATE INDEX "idx_verification_expires_at" ON "email_verification_codes"("expires_at");
