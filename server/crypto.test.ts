import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encryptField, decryptField } from "./crypto";

describe("payout field encryption", () => {
  beforeAll(() => {
    process.env.PAYOUT_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  it("round-trips an IBAN and never stores it in plain text", () => {
    const iban = "FR7630006000011234567890189";
    const payload = encryptField(iban);
    expect(payload).not.toContain(iban);
    expect(decryptField(payload)).toBe(iban);
  });

  it("uses a fresh IV each time", () => {
    expect(encryptField("FR7630006000011234567890189")).not.toBe(encryptField("FR7630006000011234567890189"));
  });

  it("rejects tampered ciphertext", () => {
    const [iv, tag, data] = encryptField("FR7630006000011234567890189").split(".");
    const flipped = Buffer.from(data, "base64");
    flipped[0] ^= 0xff;
    expect(() => decryptField([iv, tag, flipped.toString("base64")].join("."))).toThrow();
  });
});
