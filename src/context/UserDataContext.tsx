"use client";

import React, { createContext, useState, useEffect } from "react";

interface UserData {
  username: string;
  displayName: string;
  email?: string;
  courses?: string[];
  status?: string;
  isAdmin?: boolean;
  isActiveTecnicoStudent?: boolean;
  isActiveLMeicStudent?: boolean;
  isCollab?: boolean;
  isGacMember?: boolean;
  photo: string;
}

interface UserDataContextProps {
  userData: UserData | null;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
  login: () => void;
  logout: () => void;
  fetchUserData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextProps | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/userdata', { credentials: 'include' });
      if (!response.ok) {
        setUserData(null);
        return;
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUserData(null);
    window.location.href = "/";
  };

  return (
    <UserDataContext.Provider value={{ userData, setUserData, login, logout, fetchUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserDataContext;