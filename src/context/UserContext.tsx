"use client";
import React, { createContext, use, useState, useEffect, useCallback } from "react";
import { User } from "@/types/user";
import { fetchUserData } from "@/utils/userUtils";

import { Permission } from "@/types/permissions";
import { hasPermission } from "@/lib/security/permissions";

interface UserContextType {
  user: User | null;
  setUser: (_user: User | null) => void;
  hasPermission: (_permission: Permission, _context?: { department?: string }) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const REVALIDATE_DEBOUNCE_MS = 60_000; // at most once per minute

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
    let lastFetch = initialUser ? Date.now() : 0;

    const revalidate = async (force: boolean = false) => {
      const now = Date.now();
      if (!force && now - lastFetch < REVALIDATE_DEBOUNCE_MS) return;
      lastFetch = now;
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
      revalidate(true);
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

  const checkPermission = useCallback(
    (permission: Permission, context?: { department?: string }) =>
      hasPermission(user, permission, context),
    [user]
  );

  return (
    <UserContext value={{ user, setUser, hasPermission: checkPermission }}>{children}</UserContext>
  );
}

export function useUser() {
  const context = use(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
