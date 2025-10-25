export const login = () => {
  window.location.href = "/api/auth/login";
};

export const logout = async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("cartUpdated"));
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

    const userData = await response.json();
    return userData;
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
    const match = devIstidRaw.match(/^([^\[]+)\[([A-Z]+)\]$/i);
    if (match) {
      const [, istid, role] = match;
      if (dbIstid === istid) {
        return role;
      }
    }
  }
  return undefined;
}
