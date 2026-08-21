"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "./api";

interface User {
  memberId: string;
  fullName: string;
  role: "admin" | "owner" | "agent" | "member";
  isActive: boolean;
  mobileNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  memberLogin: (memberId: string) => Promise<void>; // New method
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    memberLogin: (memberId: string) => Promise<void>; // New method
    logout: () => void;
  }

  // In AuthProvider:
  const memberLogin = useCallback(async (memberId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/member-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      const loggedInUser: User = {
        memberId: data.user.memberId,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: data.user.isActive,
      };

      setToken(data.accessToken);
      setUser(loggedInUser);
      localStorage.setItem("atb_token", data.accessToken);
      localStorage.setItem("atb_user", JSON.stringify(loggedInUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ identifier, password });

      const loggedInUser: User = {
        memberId: data.user.memberId,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: data.user.isActive,
        // Remove mobileNumber — it's not in the login response
      };

      setToken(data.accessToken);
      setUser(loggedInUser);

      localStorage.setItem("atb_token", data.accessToken);
      localStorage.setItem("atb_user", JSON.stringify(loggedInUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("atb_token");
    localStorage.removeItem("atb_user");
  }, []);

  // DO NOT restore from localStorage automatically
  // This causes infinite redirects when tokens expire

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        memberLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
