import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Key: 32 bytes, base64-encoded, from PAYOUT_ENCRYPTION_KEY (never stored in the database).
function key(): Buffer {
  const raw = process.env.PAYOUT_ENCRYPTION_KEY;
  if (!raw) throw Object.assign(new Error("PAYOUT_ENCRYPTION_KEY is not set"), { statusCode: 500 });
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw Object.assign(new Error("PAYOUT_ENCRYPTION_KEY must decode to 32 bytes"), { statusCode: 500 });
  return buf;
}

/** Returns "iv.tag.ciphertext" (base64 parts). */
export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decryptField(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
