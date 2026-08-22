"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { LogIn, Loader2, ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    memberLogin,
    isAuthenticated,
    user,
    isLoading: authLoading,
  } = useAuth();

  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.role === "member" ? "/dashboard" : "/admin";
      router.replace(dest);
    }
  }, [isAuthenticated, user]);

  const handleMemberLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await memberLogin(memberId);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: staffId,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store token and user
      localStorage.setItem("atb_token", data.accessToken);
      localStorage.setItem("atb_user", JSON.stringify(data.user));

      // Redirect based on role
      const dest = data.user.role === "member" ? "/dashboard" : "/admin";
      window.location.href = dest; // Full page reload
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0A2A5E] relative overflow-hidden flex-col justify-between p-10">
        <div>
          <Link href="/" className="text-white font-bold text-xl">
            ATB<span className="text-red-300"> Ltd</span>
          </Link>
          <p className="text-neutral-300 text-sm mt-1">Member Portal</p>
        </div>
        <div>
          <p className="text-neutral-200 text-lg font-medium">
            &ldquo;টাকার অভাবে থামবে না চিকিৎসা&rdquo;
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-10 text-sm"
          >
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0A2A5E]">
              {isStaffLogin ? "Staff Login" : "Member Login"}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              {isStaffLogin
                ? "Sign in with your Staff ID and password"
                : "Enter your Member ID to sign in"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isStaffLogin ? (
            <form onSubmit={handleMemberLogin} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                  Member ID
                </label>
                <input
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="e.g., ATB-26-ME-01"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#D32F2F] text-white text-sm font-medium hover:bg-[#b71c1c] transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                  Staff ID
                </label>
                <input
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g., ATB-26-SA-1"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#0A2A5E] text-white text-sm font-medium hover:bg-[#0a2a5e]/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                {isLoading ? "Signing in..." : "Staff Sign in"}
              </button>
            </form>
          )}

          {/* Switcher */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsStaffLogin(!isStaffLogin);
                setError("");
              }}
              className="text-sm text-gray-500 hover:text-[#D32F2F] transition-colors"
            >
              {isStaffLogin ? "← Member Login" : "Staff Login →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
