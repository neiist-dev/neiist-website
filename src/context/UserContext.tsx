'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserData } from '@/types/user';
import { fetchUserData } from '@/utils/profileUtils';

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<UserData | null>;
  setUser: (user: UserData | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<UserData | null> => {
    try {
      const userData = await fetchUserData();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user data', error);
      setUser(null);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}