"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
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
  const [isLoading, setIsLoading] = useState(false); // Start false, no initial check needed

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

  // Optional: Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("atb_token");
    const storedUser = localStorage.getItem("atb_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("atb_token");
        localStorage.removeItem("atb_user");
      }
    }
  }, []);

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
