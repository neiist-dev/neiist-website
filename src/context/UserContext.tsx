'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { fetchUserData } from '@/utils/userUtils';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, initialUser }: { children: React.ReactNode, initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    if (!initialUser) {
      fetchUserData()
        .then(setUser)
        .catch(() => setUser(null));
    }
  }, [initialUser]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
