import { UserRole, hasRequiredRole } from "@/types/user";

export const publicRoutes = [
  "/home",
  "/about-us",
  "/email-confirmation",
  "/shop",
  "/activities",
  "/dinner",
];

export const guestRoutes = ["/profile", "/my-orders", "/shop/cart", "/shop/checkout", "/voting"];
export const memberRoutes = ["/orders"];
export const coordRoutes = ["/team-management", "/photo-management"];
export const adminRoutes = [
  "/users-management",
  "/departments-management",
  "/shop/manage",
  "/shop/pos",
  "/voting/manage",
];

export const protectedRoutes = [guestRoutes, memberRoutes, coordRoutes, adminRoutes].flat();

const accessRules: [string[], UserRole[]][] = [
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

export function canAccess(path: string, roles: UserRole[]): boolean {
  for (const [routes, allowed] of accessRules) {
    if (routes.some((route) => path.startsWith(route))) {
      return hasRequiredRole(roles, allowed);
    }
  }

  return (
    path === "/" ||
    publicRoutes
      .slice(1)
      .some(
        (route) => path === route || path.startsWith(route + "/") || path.startsWith(route + "?")
      )
  );
}
