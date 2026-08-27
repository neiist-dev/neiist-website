import { NextResponse } from "next/server";
import { CSP } from "@/lib/security/cspUtils";

const isDev = process.env.NODE_ENV === "development";

export function addSecurityHeaders(response: NextResponse): void {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.append("Link", `</sitemap.xml>; rel="sitemap"`);
  if (!isDev)
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}
