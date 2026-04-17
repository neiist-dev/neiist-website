export interface RateLimitRule {
  limit: number;
  windowMs: number;
  useUser?: boolean;
}

const MIN = 60_000;

export function getRateLimitRule(pathname: string): RateLimitRule | null {
  if (pathname === "/api/auth/login" || pathname === "/api/auth/callback") {
    return { limit: 5, windowMs: 15 * MIN };
  }
  if (pathname === "/api/auth/refresh") {
    return { limit: 10, windowMs: MIN };
  }
  if (pathname.startsWith("/api/user/verify-email/")) {
    return { limit: 3, windowMs: 15 * MIN };
  }
  if (pathname.startsWith("/api/admin/")) {
    return { limit: 30, windowMs: MIN, useUser: true };
  }
  if (pathname.startsWith("/api/")) {
    return { limit: 60, windowMs: MIN };
  }
  return null;
}
