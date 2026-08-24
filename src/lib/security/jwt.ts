import { cache } from "react";
import crypto from "crypto";
import { UserRole } from "@/types/user";

export interface JwtPayload {
  istid: string;
  roles: UserRole[];
  name: string;
  email: string;
  iat?: number;
  exp?: number;
  nbf?: number;
}

/**
 * Cryptographically signs an HS256 JWT using native Node.js OpenSSL HMAC SHA-256.
 */
export function signJWTWebCrypto(
  payload: JwtPayload,
  secret: string = process.env.JWT_SECRET ?? "",
  expiresInSeconds: number = 7 * 24 * 60 * 60
): string {
  if (!secret) throw new Error("JWT_SECRET is required to sign JWT");

  const header = { alg: "HS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: payload.iat ?? nowSeconds,
    exp: payload.exp ?? nowSeconds + expiresInSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const dataToSign = `${headerB64}.${payloadB64}`;

  const signatureB64 = crypto.createHmac("sha256", secret).update(dataToSign).digest("base64url");

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Cryptographically verifies an HS256 JWT using constant-time native HMAC verification.
 */
export const verifyJWTWebCrypto = cache(async function verifyJWTWebCrypto(
  token: string | undefined | null,
  secret: string = process.env.JWT_SECRET ?? ""
): Promise<JwtPayload | null> {
  if (!token || typeof token !== "string" || !secret) return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  try {
    const headerJson = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
    if (headerJson?.alg !== "HS256") return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as JwtPayload;
    if (!payload || typeof payload !== "object") return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp <= nowSeconds) return null;
    if (typeof payload.nbf === "number" && payload.nbf > nowSeconds) return null;

    const dataToVerify = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(dataToVerify)
      .digest("base64url");

    const sigBuffer = Buffer.from(signatureB64);
    const expectedBuffer = Buffer.from(expectedSig);

    if (
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return payload;
    }

    return null;
  } catch {
    return null;
  }
});
