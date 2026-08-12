"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogIn, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

export default function HospitalLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/hospitals/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // Store hospital session
      localStorage.setItem("hospital_token", data.accessToken);
      localStorage.setItem("hospital_data", JSON.stringify(data.hospital));

      router.push("/hospital/dashboard");
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
          <p className="text-neutral-300 text-sm mt-1">
            Hospital Partner Portal
          </p>
        </div>
        <div>
          <p className="text-neutral-200 text-lg font-medium">
            Verify patient claims and coordinate with ATB
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
            <div className="p-2 rounded-md bg-[#D32F2F]/10 w-fit mb-4">
              <Building2 size={22} className="text-[#D32F2F]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A2A5E]">
              Hospital Login
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              Sign in to verify patient claims
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Login ID
              </label>
              <input
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="hospital@atbltd"
                className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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
        </div>
      </div>
    </div>
  );
}
