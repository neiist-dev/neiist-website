import { NextRequest, NextResponse } from "next/server";
import { UserRole, hasRequiredRole } from "@/types/user";
import { getUserFromJWT } from "./utils/authUtils";
import { rateLimit } from "@/utils/security/rateLimitUtils";
import { CSP } from "@/utils/security/cspUtils";
import { getRateLimitRule } from "@/lib/rateLimitRules";
import { BOT_USER_AGENTS } from "@/lib/botAgents";

const publicRoutes = [
  "/home",
  "/about-us",
  "/email-confirmation",
  "/shop",
  "/activities",
  "/dinner",
];
const guestRoutes = ["/profile", "/my-orders", "/shop/cart", "/shop/checkout", "/voting"];
const memberRoutes = ["/orders"];
const coordRoutes = ["/team-management", "/photo-management"];
const adminRoutes = [
  "/users-management",
  "/departments-management",
  "/shop/manage",
  "/voting/admin",
];
const protectedRoutes = [guestRoutes, memberRoutes, coordRoutes, adminRoutes].flat();


const isDev = process.env.NODE_ENV === "development";

const MARKDOWN_SITE = `# NEIIST — Núcleo Estudantil de Informática do IST

Associação de estudantes de Informática do Instituto Superior Técnico, Lisboa.

## Páginas Públicas

- [Início](https://neiist.tecnico.ulisboa.pt/)
- [Sobre Nós](https://neiist.tecnico.ulisboa.pt/about-us)
- [Atividades](https://neiist.tecnico.ulisboa.pt/activities)
- [Loja](https://neiist.tecnico.ulisboa.pt/shop)
- [Jantar](https://neiist.tecnico.ulisboa.pt/dinner)
`;

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isBot(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent")?.toLowerCase() ?? "";
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.append("Link", `</sitemap.xml>; rel="sitemap"`);
  if (!isDev) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function canAccess(path: string, roles: UserRole[]) {
  if (path === "/" || publicRoutes.slice(1).some((r) => path.startsWith(r))) return true;

  const rules: [string[], UserRole[]][] = [
    [adminRoutes, [UserRole._ADMIN]],
    [coordRoutes, [UserRole._ADMIN, UserRole._COORDINATOR]],
    [
      memberRoutes,
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._SHOP_MANAGER, UserRole._MEMBER],
    ],
    [
      guestRoutes,
      [
        UserRole._ADMIN,
        UserRole._COORDINATOR,
        UserRole._SHOP_MANAGER,
        UserRole._MEMBER,
        UserRole._GUEST,
      ],
    ],
  ];

  for (const [routes, allowed] of rules) {
    if (routes.some((r) => path.startsWith(r))) {
      return hasRequiredRole(roles, allowed);
    }
  }

  return false;
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isBot(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
      const jwtUser = getUserFromJWT(sessionToken);
      const identifier = rule.useUser ? (jwtUser?.istid ?? getIp(req)) : getIp(req);
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
      const response = NextResponse.redirect(new URL("/api/auth/login", req.url));
      addSecurityHeaders(response);
      return response;
    }
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  if (isAuthenticated) {
    const sessionToken = req.cookies.get("session")?.value;
    const jwtUser = getUserFromJWT(sessionToken);
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
