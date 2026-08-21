"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { membershipApi } from "../lib/api";
import {
  CreditCard,
  Calendar,
  Shield,
  Clock,
  Copy,
  CheckCircle2,
  Loader2,
  FileText,
  User,
  ChevronRight,
  Activity,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DashboardData {
  profile: {
    memberId: string;
    fullName: string;
    mobileNumber: string;
    email: string | null;
    isActive: boolean;
    isKycVerified: boolean;
    createdAt: string;
  };
  membership: {
    membershipFee: number;
    isPaymentVerified: boolean;
    membershipStartDate: string | null;
    membershipEndDate: string | null;
    isActive: boolean;
    remainingBenefit: number;
    renewalFee: number;
  } | null;
  digitalCard: {
    memberId: string;
    fullName: string;
    membershipType: string;
    validUntil: string | null;
    remainingBenefit: number;
    isActive: boolean;
  };
}

export default function MemberDashboard() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !token) {
      router.replace("/login");
      return;
    }
    if (token && isAuthenticated) loadDashboard();
  }, [authLoading, isAuthenticated, token]);

  const loadDashboard = async () => {
    try {
      const data = await membershipApi.getDashboard(token!);
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMemberId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin text-[#D32F2F] mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const benefitChartData = [
    {
      name: "Used",
      value: 12000 - (dashboard?.digitalCard.remainingBenefit || 0),
      color: "#D32F2F",
    },
    {
      name: "Remaining",
      value: dashboard?.digitalCard.remainingBenefit || 0,
      color: "#22c55e",
    },
  ];

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A5E]">
            Welcome, {dashboard?.profile.fullName?.split(" ")[0] || "Member"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Member since{" "}
            {formatDate(dashboard?.membership?.membershipStartDate || null)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border w-fit ${
            dashboard?.membership?.isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${dashboard?.membership?.isActive ? "bg-green-600" : "bg-amber-600"}`}
          />
          {dashboard?.membership?.isActive ? "Active" : "Pending"}
        </span>
      </div>

      {/* Membership Card */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Membership ID
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[#0A2A5E] font-mono text-lg font-bold">
                {dashboard?.digitalCard.memberId}
              </p>
              <button
                onClick={() =>
                  copyMemberId(dashboard?.digitalCard.memberId || "")
                }
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                {copied ? (
                  <CheckCircle2 size={15} className="text-green-600" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Valid Until
            </p>
            <p className="text-[#0A2A5E] font-semibold mt-1">
              {formatDate(dashboard?.digitalCard.validUntil)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <div className="w-16 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={benefitChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={30}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {benefitChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[#0A2A5E] text-xl font-bold">
                {dashboard?.digitalCard.remainingBenefit?.toLocaleString() || 0}
              </span>
              <span className="text-gray-500 text-sm">BDT remaining</span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5">
              of 12,000 BDT annual benefit
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Shield,
            label: "KYC Status",
            value: dashboard?.profile.isKycVerified ? "Verified" : "Pending",
            color: dashboard?.profile.isKycVerified ? "#22c55e" : "#eab308",
          },
          {
            icon: Calendar,
            label: "Member Since",
            value:
              formatDate(dashboard?.membership?.membershipStartDate || null)
                ?.split(" ")
                .slice(0, 2)
                .join(" ") || "—",
            color: "#0A2A5E",
          },
          {
            icon: Activity,
            label: "Claims This Year",
            value: "0",
            color: "#a855f7",
          },
          {
            icon: CreditCard,
            label: "Renewal Fee",
            value: "850 BDT",
            color: "#f59e0b",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-md p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-semibold">
                {stat.label}
              </span>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-[#0A2A5E] font-bold text-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            icon: FileText,
            label: "Submit a Benefit Application",
            desc: "Request financial assistance",
            href: "/dashboard/claims/new",
            accent: "#D32F2F",
          },
          {
            icon: User,
            label: "Update Profile",
            desc: "Manage your information",
            href: "/dashboard/profile",
            accent: "#0A2A5E",
          },
          {
            icon: CreditCard,
            label: "Digital Card",
            desc: "View your membership card",
            href: "/dashboard/card",
            accent: "#22c55e",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group bg-white border border-gray-200 rounded-md p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="p-2 rounded-md"
                style={{ backgroundColor: `${action.accent}10` }}
              >
                <action.icon size={17} style={{ color: action.accent }} />
              </div>
              <ChevronRight
                size={15}
                className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
              />
            </div>
            <h3 className="text-[#0A2A5E] font-semibold text-sm">
              {action.label}
            </h3>
            <p className="text-gray-400 text-xs mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>

      {dashboard?.profile.isActive &&
        dashboard?.membership &&
        !dashboard.membership.isActive && (
          <div className="flex items-start gap-3 p-4 rounded-md bg-amber-50 border border-amber-200">
            <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-semibold">
                Membership Pending Activation
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Your payment is being verified. Benefits available one month
                after activation.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
