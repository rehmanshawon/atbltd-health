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
  login: (mobileNumber: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (mobileNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ mobileNumber, password });

      const loggedInUser: User = {
        memberId: data.user.memberId,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: data.user.isActive,
        mobileNumber,
      };

      setToken(data.accessToken);
      setUser(loggedInUser);

      // Store for refresh recovery
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
