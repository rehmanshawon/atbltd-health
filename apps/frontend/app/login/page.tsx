"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { LogIn, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Only redirect after login completes AND auth state is confirmed
  useEffect(() => {
    if (shouldRedirect && isAuthenticated && user && !authLoading) {
      const dest =
        user.role === "admin" || user.role === "owner"
          ? "/admin"
          : "/dashboard";
      router.replace(dest);
    }
  }, [shouldRedirect, isAuthenticated, user, authLoading, router]);

  // Handle already-authenticated users on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const dest =
        user.role === "admin" || user.role === "owner"
          ? "/admin"
          : "/dashboard";
      router.replace(dest);
    }
  }, []); // Only run on mount

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(mobileNumber, password);
      setShouldRedirect(true); // Trigger redirect after state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-[#060d1a] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0A2A5E] relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-red-600/5" />
        <div className="relative z-10">
          <Link
            href="/"
            className="text-white font-bold text-xl tracking-tight"
          >
            ATB<span className="text-red-400"> Ltd</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">
            Astha Treatment Bills Ltd
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-neutral-300 text-lg font-medium leading-relaxed">
            &ldquo;Medical treatment will not stop due to lack of money.&rdquo;
          </p>
          <p className="text-neutral-500 text-sm mt-3">
            — A.K.M. Moshiur Rahman, Founder & Chairman
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-neutral-500 text-xs">
          <span>© {new Date().getFullYear()} ATB Ltd</span>
          <span>·</span>
          <span>Secure Portal</span>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-neutral-300 mb-12 transition-colors text-sm"
          >
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="mb-8 ">
            <h1 className="text-2xl font-bold text-[#0A2A5E]">Sign in</h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Enter your mobile number and password
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-gray-500/[0.08]] text-gray-900 placeholder-neutral-500 focus:border-white/25 focus:outline-none focus:ring-0 transition-colors text-sm disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-xs font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-gray-500/[0.08]] text-gray-900 placeholder-neutral-500 focus:border-white/25 focus:outline-none focus:ring-0 transition-colors text-sm disabled:opacity-40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white border border-gray-500/[0.08]]text-black font-medium text-sm  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/"
              className="text-white hover:text-neutral-300 transition-colors underline underline-offset-4"
            >
              Become a member
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
