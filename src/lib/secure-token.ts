import crypto from "node:crypto";

export function createPublicToken(prefix = "ap") {
  return `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;
}

export function hashSecret(value: string) {
  return crypto.createHash("sha256").update(value.trim()).digest("hex");
}

export function maskIdNumber(value: string) {
  const clean = value.replace(/\s+/g, "");
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

export function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}
