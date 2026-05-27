-- Drop old express-session format sessions table and create new Auth.js sessions table
DROP TABLE IF EXISTS "sessions" CASCADE;

CREATE TABLE "sessions" (
  "sessionToken" TEXT NOT NULL PRIMARY KEY,
  "userId" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP NOT NULL
);

CREATE INDEX "idx_sessions_userId" ON "sessions"("userId");
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires");
