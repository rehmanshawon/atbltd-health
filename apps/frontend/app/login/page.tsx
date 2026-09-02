'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { LogIn, Loader2, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, memberLogin, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffLoginStep, setStaffLoginStep] = useState<'id-password' | 'otp'>('id-password');
  const [staffOtp, setStaffOtp] = useState('');
  // Redirect if already authenticated

  const handleMemberLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await memberLogin(memberId);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (staffLoginStep === 'id-password') {
        // Step 1: Verify ID + password, then send OTP
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: staffId, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        // Password correct — send OTP
        const otpRes = await fetch(`${API_BASE}/auth/staff-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId }),
        });

        const otpData = await otpRes.json();
        if (!otpRes.ok) throw new Error(otpData.message || 'Failed to send OTP');

        setStaffLoginStep('otp');
      } else {
        // Step 2: Verify OTP and complete login
        const res = await fetch(`${API_BASE}/auth/staff-login-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, otp: staffOtp }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'OTP verification failed');

        localStorage.setItem('atb_token', data.accessToken);
        localStorage.setItem('atb_user', JSON.stringify(data.user));

        window.location.href = '/admin';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0A2A5E] relative overflow-hidden flex-col justify-between p-10">
        <div>
          <Link href="/" className="block w-fit">
            <div className="bg-white rounded-lg p-2 shadow-lg">
              <div className="relative h-10 w-[150px] sm:h-15 sm:w-[100px] overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="ATB"
                  fill
                  priority
                  className="object-contain object-left select-none pointer-events-none"
                />
              </div>
            </div>
          </Link>
          <p className="text-neutral-300 text-sm mt-3">Member Portal</p>
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
              {isStaffLogin ? 'Staff Login' : 'Member Login'}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">
              {isStaffLogin
                ? 'Sign in with your Staff ID and password'
                : 'Enter your Member ID to sign in'}
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
                  placeholder="Enter your Member ID"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#D32F2F] text-white text-sm font-medium hover:bg-[#b71c1c] transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <>
              {/* Step 1: ID + Password */}
              {staffLoginStep === 'id-password' && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                      Staff ID
                    </label>
                    <input
                      required
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="Enter your Staff ID"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
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
                    {isLoading ? 'Signing in...' : 'Continue'}
                  </button>
                </form>
              )}

              {/* Step 2: OTP */}
              {staffLoginStep === 'otp' && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <p className="text-gray-500 text-sm">Enter the OTP sent to your mobile number</p>
                  <div>
                    <label className="block text-gray-600 text-xs font-semibold mb-1.5">OTP</label>
                    <input
                      required
                      value={staffOtp}
                      onChange={(e) => setStaffOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      placeholder="Enter OTP"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]/20 text-sm tracking-[0.3em] text-center"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStaffLoginStep('id-password')}
                      className="px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-[#0A2A5E] text-white text-sm font-medium hover:bg-[#0a2a5e]/90 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Shield size={16} />
                      )}
                      {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          {/* Switcher */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsStaffLogin(!isStaffLogin);
                setError('');
              }}
              className="text-sm text-gray-500 hover:text-[#D32F2F] transition-colors"
            >
              {isStaffLogin ? '← Member Login' : 'Staff Login →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
