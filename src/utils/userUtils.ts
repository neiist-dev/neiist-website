import type { User } from "@/types/user";
import { clearClientCart, discardCheckoutHold } from "@/utils/shop/shopUtils";

export async function searchUsersClient(query: string, signal?: AbortSignal): Promise<User[]> {
  try {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=20`, {
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || (Array.isArray(data) ? data : []);
  } catch {
    return [];
  }
}

export function formatSearchedUserLabel(user: User, currentQuery?: string): string {
  const q = currentQuery?.trim().toLowerCase();
  if (q && user.istid.toLowerCase() === q) return currentQuery!.trim();

  return `${user.name} (${user.istid})`;
}

export const login = (customReturnUrl?: string | unknown) => {
  const target =
    typeof customReturnUrl === "string" && customReturnUrl.trim()
      ? customReturnUrl.trim()
      : window.location.pathname + window.location.search;
  const returnUrl = encodeURIComponent(target);
  window.location.href = `/api/auth/login?returnUrl=${returnUrl}`;
};

export const logout = async () => {
  await discardCheckoutHold();
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  clearClientCart();
  window.location.href = "/";
};

export async function fetchUserData() {
  try {
    const response = await fetch(`/api/auth/userdata`, {
      cache: "no-store",
      credentials: "include", // Send cookies with the request.
    });

    if (!response.ok) {
      if (response.status === 401)
        // No accessToken present.
        return null;
      console.error("Failed to fetch user data:", response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export function getFirstAndLastName(fullName: string) {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function devOverrideRole(dbIstid: string): string | undefined {
  const devIstidRaw = process.env.DEV_ISTID;
  const isDev = process.env.NODE_ENV === "development";
  if (isDev && devIstidRaw) {
    const match = devIstidRaw.match(/^([^[]+)\[([A-Z]+)]$/i);
    if (match) {
      const [, istid, role] = match;
      if (dbIstid === istid) return role;
    }
  }
  return undefined;
}

export function extractCourses(
  registrations: import("@/types/fenix").FenixRegistration[] = []
): string[] {
  const courses = new Set<string>();
  for (const reg of registrations) {
    const degree = reg?.degree;
    if (!degree) continue;
    const rawName =
      typeof degree.name === "object"
        ? (degree.name?.["pt-PT"] ?? degree.name?.["en-GB"])
        : degree.name;
    const name = (rawName || degree.acronym)?.trim();
    if (name) courses.add(name);
  }
  return Array.from(courses);
}
