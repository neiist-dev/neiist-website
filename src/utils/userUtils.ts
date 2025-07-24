export const login = () => {
  window.location.href = "/api/auth/login";
};

export const logout = async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
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
