import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";
import { verifyJWTWebCrypto } from "@/lib/security/jwt";
import { rateLimit } from "@/lib/security/rateLimitUtils";
import { getRateLimitRule } from "@/lib/security/rateLimitRules";
import { isBot, getClientIp } from "@/lib/security/botAgents";
import { addSecurityHeaders } from "@/lib/security/securityHeaders";
import { canAccess, protectedRoutes } from "@/lib/security/routePermissions";

const MARKDOWN_SITE = `# NEIIST — Núcleo Estudantil de Informática do IST

Associação de estudantes de Informática do Instituto Superior Técnico, Lisboa.

## Páginas Públicas

- [Início](https://neiist.tecnico.ulisboa.pt/)
- [Sobre Nós](https://neiist.tecnico.ulisboa.pt/about-us)
- [Atividades](https://neiist.tecnico.ulisboa.pt/activities)
- [Loja](https://neiist.tecnico.ulisboa.pt/shop)
- [Jantar](https://neiist.tecnico.ulisboa.pt/dinner)
`;

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isBot(req)) return new NextResponse("Forbidden", { status: 403 });

  if (!path.startsWith("/api/") && (req.headers.get("accept") ?? "").includes("text/markdown")) {
    return new NextResponse(MARKDOWN_SITE, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  if (path.startsWith("/api/")) {
    const rule = getRateLimitRule(path);
    if (rule) {
      const sessionToken = req.cookies.get("session")?.value;
      const jwtUser = await verifyJWTWebCrypto(sessionToken);
      const identifier = rule.useUser ? (jwtUser?.istid ?? getClientIp(req)) : getClientIp(req);
      const bucketKey = `${path.split("/").slice(0, 4).join("/")}:${identifier}`;
      const result = rateLimit(bucketKey, rule.limit, rule.windowMs);

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
        return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rule.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.reset),
          },
        });
      }
    }

    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  if (!isAuthenticated && protectedRoutes.some((r) => path.startsWith(r))) {
    if (path !== "/api/auth/login") {
      const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
      const loginUrl = new URL("/api/auth/login", req.url);
      loginUrl.searchParams.set("returnUrl", returnUrl);
      const response = NextResponse.redirect(loginUrl);
      addSecurityHeaders(response);
      return response;
    }
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  if (isAuthenticated) {
    const sessionToken = req.cookies.get("session")?.value;
    const jwtUser = await verifyJWTWebCrypto(sessionToken);
    const roles = jwtUser?.roles || [UserRole._GUEST];

    if (!canAccess(path, roles)) {
      if (path !== "/unauthorized") {
        const response = NextResponse.redirect(new URL("/unauthorized", req.url));
        addSecurityHeaders(response);
        return response;
      }
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon\\.ico|products/|static/|images/|image/|.*\\..*$).*)"],
};
