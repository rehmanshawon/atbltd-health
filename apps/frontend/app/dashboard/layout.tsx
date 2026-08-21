"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  User,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import Link from "next/link";
import NotificationBell from "../components/NotificationBell";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/profile", icon: User },
  { label: "Claims", href: "/dashboard/claims", icon: FileText },
  { label: "Digital Card", href: "/dashboard/card", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-[#0A2A5E] z-10 flex flex-col">
            <div className="h-16 flex items-center px-5 border-b border-white/10">
              <Link
                href="/"
                className="text-white font-bold text-lg tracking-tight"
              >
                ATB<span className="text-red-300"> Ltd</span>
              </Link>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <item.icon size={18} /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-white/50 hover:text-white hover:bg-white/8 text-sm"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="flex min-h-screen">
        {/* Sidebar spacer - invisible div that pushes content right */}
        <div className="hidden lg:block w-[220px] shrink-0" />

        {/* Fixed sidebar */}
        <div className="hidden lg:flex flex-col w-[220px] fixed inset-y-0 left-0 z-30 bg-[#0A2A5E]">
          <div className="h-16 flex items-center px-5 border-b border-white/10">
            <Link
              href="/"
              className="text-white font-bold text-lg tracking-tight"
            >
              ATB<span className="text-red-300"> Ltd</span>
            </Link>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <item.icon size={18} /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#D32F2F] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.fullName?.charAt(0) || "M"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.fullName}
                </p>
                <p className="text-white/50 text-xs capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-white/50 hover:text-white hover:bg-white/8 text-sm"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D32F2F] flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0) || "M"}
                </div>
                <span className="text-gray-700 text-sm font-medium hidden md:inline">
                  {user?.fullName}
                </span>
              </div>
            </div>
          </header>
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
