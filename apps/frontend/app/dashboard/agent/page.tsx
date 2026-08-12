"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { Users, TrendingUp, Banknote, UserCheck, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface AgentSummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  totalReversed: number;
  recentCommissions: Array<{
    id: string;
    memberCode: string;
    commissionType: string;
    commissionAmount: number;
    status: string;
    createdAt: string;
    member?: { fullName: string };
  }>;
}

export default function AgentDashboard() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<AgentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadSummary();
  }, [token]);

  const loadSummary = async () => {
    try {
      // First get the agent ID for this user
      const profileRes = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      // Then get commission summary
      const res = await fetch(
        `${API_BASE}/commissions/agent/${profile.id}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Agent Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Your performance & commissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earned",
            value: formatCurrency(summary?.totalEarned || 0),
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Paid",
            value: formatCurrency(summary?.totalPaid || 0),
            icon: Banknote,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Pending",
            value: formatCurrency(summary?.totalPending || 0),
            icon: UserCheck,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Reversed",
            value: formatCurrency(summary?.totalReversed || 0),
            icon: Users,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-md p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <span className="text-gray-500 text-xs font-semibold">
                {stat.label}
              </span>
            </div>
            <p className="text-brand-blue text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Commissions */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-gray-700 text-sm font-semibold">
            Recent Commissions
          </h2>
        </div>
        {!summary?.recentCommissions?.length ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No commissions yet
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Member
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Type
                </th>
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Amount
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.recentCommissions.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-medium">
                    {c.memberCode}
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs capitalize">
                    {c.commissionType.replace(/_/g, " ")}
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-700 text-sm font-medium">
                    {formatCurrency(c.commissionAmount)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
