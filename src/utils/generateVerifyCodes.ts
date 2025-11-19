// src/utils/generateVerifyCodes.ts
import crypto from "crypto";

export function generateVerificationCode() {
  const unHashedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

  const hashedCode = crypto
    .createHash("sha256")
    .update(unHashedCode)
    .digest("hex");

  return { unHashedCode, hashedCode, expiry };
}
