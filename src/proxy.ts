import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/types/user";

const publicRoutes = ["/", "/home", "/about-us", "/email-confirmation", "/shop"];
const guestRoutes = ["/profile", "/my-orders", "/shop/cart", "/shop/checkout"];
const memberRoutes = ["/orders"];
const coordRoutes = ["/team-management", "/photo-management", "/orders/manage"];
const adminRoutes = [
  "/users-management",
  "/departments-management",
  "/activities-management",
  "/shop/manage",
];

const protectedRoutes = [...guestRoutes, ...memberRoutes, ...coordRoutes, ...adminRoutes];

export const config = {
  matcher: ["/((?!api|_next/|favicon.ico|.*\\..*$|static/|images/|image/).*)"],
};

function canAccess(path: string, roles: UserRole[]) {
  if (path === "/" || publicRoutes.slice(1).some((r) => path.startsWith(r))) {
    return true;
  }
  if (adminRoutes.some((r) => path.startsWith(r))) {
    return roles.includes(UserRole._ADMIN);
  } else if (coordRoutes.some((r) => path.startsWith(r))) {
    return roles.some((role) => [UserRole._ADMIN, UserRole._COORDINATOR].includes(role));
  } else if (memberRoutes.some((r) => path.startsWith(r))) {
    return roles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER].includes(role)
    );
  } else if (guestRoutes.some((r) => path.startsWith(r))) {
    return roles.some((role) =>
      [UserRole._ADMIN, UserRole._COORDINATOR, UserRole._MEMBER, UserRole._GUEST].includes(role)
    );
  }
  return false;
}

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const accessToken = req.cookies.get("accessToken")?.value;
  const isAuthenticated = !!accessToken;

  if (!isAuthenticated && protectedRoutes.some((r) => path.startsWith(r))) {
    if (path !== "/api/auth/login") {
      return NextResponse.redirect(new URL("/api/auth/login", req.url));
    }
    return NextResponse.next();
  }

  if (isAuthenticated) {
    const userDataCookie = req.cookies.get("userData")?.value;
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
