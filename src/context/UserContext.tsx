"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types/user";
import { fetchUserData } from "@/utils/userUtils";

interface UserContextType {
  user: User | null;
  setUser: (_user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    let mounted = true;
    const revalidate = async () => {
      try {
        const fresh = await fetchUserData();
        if (!mounted) return;
        setUser(fresh ?? null);
      } catch {
        if (!mounted) return;
        setUser(null);
      }
    };
    if (!initialUser) {
      revalidate();
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") revalidate();
    };
    const onFocus = () => revalidate();

    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [initialUser]);

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
