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

function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return uint8ArrayToBase64Url(bytes);
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function base64UrlDecodeUtf8(base64Url: string): string {
  const bytes = base64UrlToUint8Array(base64Url);
  return new TextDecoder().decode(bytes);
}

/**
 * Cryptographically signs an HS256 JWT using standard Web Crypto API.
 */
export async function signJWTWebCrypto(
  payload: Omit<JwtPayload, "exp" | "iat">,
  secret: string = process.env.JWT_SECRET ?? "",
  expiresInSeconds: number = 86400
): Promise<string> {
  if (!secret) {
    throw new Error("JWT_SECRET is required to sign JWT");
  }

  const header = { alg: "HS256", typ: "JWT" };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + expiresInSeconds,
  };

  const headerB64 = utf8ToBase64Url(JSON.stringify(header));
  const payloadB64 = utf8ToBase64Url(JSON.stringify(fullPayload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign));

  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  return `${dataToSign}.${signatureB64}`;
}

/**
 * Cryptographically verifies an HS256 JWT using the standard Web Crypto API.
 */
export async function verifyJWTWebCrypto(
  token: string | undefined | null,
  secret: string = process.env.JWT_SECRET ?? ""
): Promise<JwtPayload | null> {
  if (!token || typeof token !== "string" || !secret) return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  try {
    const headerJson = JSON.parse(base64UrlDecodeUtf8(headerB64));
    if (headerJson?.alg !== "HS256") return null;

    const payload = JSON.parse(base64UrlDecodeUtf8(payloadB64)) as JwtPayload;
    if (!payload || typeof payload !== "object") return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp <= nowSeconds) return null;

    if (typeof payload.nbf === "number" && payload.nbf > nowSeconds) return null;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      dataToVerify as unknown as BufferSource
    );

    if (!isValid) return null;

    return payload;
  } catch {
    return null;
  }
}
