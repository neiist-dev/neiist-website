import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";

const publicRoutes = ["/home", "/about-us", "/email-confirmation", "/shop"];
const guestRoutes = ["/profile", "/my-orders", "/shop/cart", "/shop/checkout"];
const memberRoutes = ["/orders"];
const coordRoutes = ["/team-management", "/photo-management", "/orders/manage"];
const adminRoutes = [
  "/users-management",
  "/departments-management",
  "/activities-management",
  "/shop/manage",
];
const protectedRoutes = [guestRoutes, memberRoutes, coordRoutes, adminRoutes].flat();

function canAccess(path: string, roles: UserRole[]) {
  if (path === "/" || publicRoutes.slice(1).some((r) => path.startsWith(r))) return true;

  const rules: [string[], UserRole[]][] = [
    [adminRoutes, [UserRole._ADMIN]],
    [coordRoutes, [UserRole._ADMIN, UserRole._COORDINATOR]],
    [memberRoutes, [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER]],
    [guestRoutes, [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER, UserRole._GUEST]],
  ];

  for (const [routes, allowed] of rules) {
    if (routes.some((r) => path.startsWith(r))) {
      return roles.some((role) => allowed.includes(role));
    }
  }

  return false;
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const accessToken = req.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  if (!isAuthenticated && protectedRoutes.some((r) => path.startsWith(r))) {
    if (path !== "/api/auth/login") {
      return NextResponse.redirect(new URL("/api/auth/login", req.url));
    }
    return NextResponse.next();
  }

  if (isAuthenticated) {
    const userDataCookie = req.cookies.get("user_data")?.value;
    let userData;
    try {
      userData = userDataCookie ? JSON.parse(userDataCookie) : null;
    } catch {
      userData = null;
    }
    const roles = userData?.roles || [UserRole._GUEST];

    if (!canAccess(path, roles)) {
      if (path !== "/unauthorized") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/|favicon.ico|.*\\..*$|static/|images/|image/).*)"],
};
