import { UserRole, ROLE_HIERARCHY } from "@/types/roles";

export const publicRoutes = [
  "/home",
  "/about-us",
  "/email-confirmation",
  "/shop",
  "/activities",
  "/unauthorized",
];

export const ROUTE_TIERS: Record<string, UserRole> = {
  "/profile": UserRole._GUEST,
  "/my-orders": UserRole._GUEST,
  "/shop/cart": UserRole._GUEST,
  "/shop/checkout": UserRole._GUEST,
  "/voting": UserRole._GUEST,
  "/orders": UserRole._MEMBER,
  "/management": UserRole._COORDINATOR,
  "/shop/manage": UserRole._ADMIN,
  "/shop/pos": UserRole._ADMIN,
  "/voting/manage": UserRole._ADMIN,
  "/dinner": UserRole._ADMIN,
};

export const protectedRoutes = Object.keys(ROUTE_TIERS);

export function canAccess(path: string, roles: UserRole[]): boolean {
  const tier = Object.entries(ROUTE_TIERS).find(([route]) => path.startsWith(route))?.[1];

  if (!tier) {
    // Public route
    return (
      path === "/" ||
      publicRoutes.some(
        (route) => path === route || path.startsWith(route + "/") || path.startsWith(route + "?")
      )
    );
  }

  const requiredLevel = ROLE_HIERARCHY[tier] ?? 0;
  const userLevel = Math.max(0, ...roles.map((r) => ROLE_HIERARCHY[r] ?? 0));
  return userLevel >= requiredLevel;
}
