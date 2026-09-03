'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface User {
  memberId: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'owner' | 'agent' | 'member';
  isActive: boolean;
  mobileNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isRestored: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  memberLogin: (memberId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('atb_token');
    const storedUser = localStorage.getItem('atb_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('atb_token');
        localStorage.removeItem('atb_user');
      }
    }
    setIsRestored(true);
  }, []);

  // Staff login (identifier = Staff ID or mobile, + password)
  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ identifier, password });

      const loggedInUser: User = {
        memberId: data.user.memberId,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: data.user.isActive,
      };

      setToken(data.accessToken);
      setUser(loggedInUser);

      localStorage.setItem('atb_token', data.accessToken);
      localStorage.setItem('atb_user', JSON.stringify(loggedInUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Member login (Member ID only, no password)
  const memberLogin = useCallback(async (memberId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/member-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      const loggedInUser: User = {
        memberId: data.user.memberId,
        fullName: data.user.fullName,
        role: data.user.role,
        isActive: data.user.isActive,
      };

      setToken(data.accessToken);
      setUser(loggedInUser);

      localStorage.setItem('atb_token', data.accessToken);
      localStorage.setItem('atb_user', JSON.stringify(loggedInUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('atb_token');
    localStorage.removeItem('atb_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        isRestored,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
