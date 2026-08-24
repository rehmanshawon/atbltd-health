"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { adminApi } from "../lib/api";
import {
  Users,
  Banknote,
  FileText,
  UserCheck,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface AdminStats {
  members: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  payments: {
    totalCollection: number;
    pendingVerification: number;
    verifiedToday: number;
  };
  claims: {
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  agents: { total: number; active: number };
  commissions?: {
    totalEarned: number;
    totalPaid: number;
  };
}

interface PendingPayment {
  id: string;
  amount: number;
  method: string;
  //transactionId: string;
  senderAccount: string;
  status: string;
  createdAt: string;
  user?: { memberId: string; fullName: string; mobileNumber: string };
}

const defaultStats: AdminStats = {
  members: { total: 0, active: 0, inactive: 0, newThisMonth: 0 },
  payments: { totalCollection: 0, pendingVerification: 0, verifiedToday: 0 },
  claims: { submitted: 0, pending: 0, approved: 0, rejected: 0 },
  agents: { total: 0, active: 0 },
  commissions: { totalEarned: 0, totalPaid: 0 },
};

const revenueData = [
  { month: "Jan", collection: 45000, claims: 12000 },
  { month: "Feb", collection: 52000, claims: 18000 },
  { month: "Mar", collection: 48000, claims: 15000 },
  { month: "Apr", collection: 61000, claims: 22000 },
  { month: "May", collection: 55000, claims: 19000 },
  { month: "Jun", collection: 67000, claims: 25000 },
  { month: "Jul", collection: 72000, claims: 28000 },
  { month: "Aug", collection: 68000, claims: 26000 },
];

const memberGrowthData = [
  { month: "Jan", members: 1200 },
  { month: "Feb", members: 1350 },
  { month: "Mar", members: 1500 },
  { month: "Apr", members: 1680 },
  { month: "May", members: 1850 },
  { month: "Jun", members: 2100 },
  { month: "Jul", members: 2400 },
  { month: "Aug", members: 2650 },
];

const claimStatusData = [
  { name: "Approved", value: 65, color: "#22c55e" },
  { name: "Pending", value: 20, color: "#eab308" },
  { name: "Rejected", value: 10, color: "#ef4444" },
  { name: "Under Review", value: 5, color: "#3b82f6" },
];

export default function AdminDashboard() {
  const { token, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isStaff = user?.role === "super_admin" || user?.role === "admin";

  useEffect(() => {
    if (user && user.role === "member") {
      router.replace("/dashboard");
      return;
    }
    if (token && isAuthenticated) {
      loadData();
    }
  }, [user, token, isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isStaff) {
        const [s, p] = await Promise.all([
          adminApi.getDashboard(token!),
          adminApi.getPendingPayments(token!),
        ]);
        setStats({ ...defaultStats, ...s });
        setPendingPayments(Array.isArray(p) ? p : []);
      } else {
        // Owner/Agent: get their own stats only
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats({
            members: {
              total: data.members?.total || 0,
              active: data.members?.active || 0,
              inactive: 0,
              newThisMonth: 0,
            },
            payments: {
              totalCollection: 0,
              pendingVerification: 0,
              verifiedToday: 0,
            },
            claims: { submitted: 0, pending: 0, approved: 0, rejected: 0 },
            agents: {
              total: data.agents?.total || 0,
              active: 0,
            },
            commissions: {
              totalEarned: data.commissions?.totalEarned || 0,
              totalPaid: data.commissions?.totalPaid || 0,
            },
          });
        } else {
          setStats(defaultStats);
        }
        setPendingPayments([]);
      }
    } catch (err) {
      console.error(err);
      setStats(defaultStats);
      setPendingPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await adminApi.verifyPayment(id, token!);
      setActionMsg({
        type: "success",
        text: "Payment authorized successfully",
      });
      await loadData();
    } catch {
      setActionMsg({ type: "error", text: "Authorization failed" });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2
            size={28}
            className="animate-spin text-[#D32F2F] mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A5E]">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isStaff
              ? "Monitor your organization's performance"
              : "Your performance summary"}
          </p>
        </div>
        {isStaff && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={14} />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium border ${
            actionMsg.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <CheckCircle2 size={15} /> {actionMsg.text}
        </div>
      )}

      {isStaff ? (
        <>
          {/* KPI Cards - Staff only */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Members",
                value: stats.members.total.toLocaleString(),
                change: `+${stats.members.newThisMonth} this month`,
                changeType: "up" as const,
                icon: Users,
                color: "#3b82f6",
              },
              {
                label: "Total Collection",
                value: `${stats.payments.totalCollection.toLocaleString()} BDT`,
                change: `${stats.payments.pendingVerification} pending verification`,
                changeType: "warn" as const,
                icon: Banknote,
                color: "#22c55e",
              },
              {
                label: "Claims Submitted",
                value: stats.claims.submitted.toString(),
                change: `${stats.claims.approved} approved · ${stats.claims.rejected} rejected`,
                changeType: "neutral" as const,
                icon: FileText,
                color: "#a855f7",
              },
              {
                label: "Active Agents",
                value: stats.agents.active.toString(),
                change: `of ${stats.agents.total} total`,
                changeType: "neutral" as const,
                icon: UserCheck,
                color: "#D32F2F",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white border border-gray-200 rounded-md p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    {kpi.label}
                  </span>
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <kpi.icon size={16} style={{ color: kpi.color }} />
                  </div>
                </div>
                <p className="text-[#0A2A5E] text-2xl font-bold">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {kpi.changeType === "up" && (
                    <ArrowUp size={12} className="text-green-600" />
                  )}
                  {kpi.changeType === "warn" && (
                    <ArrowDown size={12} className="text-amber-600" />
                  )}
                  {kpi.changeType === "neutral" && (
                    <Minus size={12} className="text-gray-400" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      kpi.changeType === "up"
                        ? "text-green-600"
                        : kpi.changeType === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                    }`}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[#0A2A5E] font-semibold text-sm">
                    Revenue vs Claims
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Monthly comparison
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#0A2A5E]" />
                    <span className="text-gray-500 text-xs">Collection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D32F2F]" />
                    <span className="text-gray-500 text-xs">Claims Paid</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="collection"
                    fill="#0A2A5E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="claims"
                    fill="#D32F2F"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-[#0A2A5E] font-semibold text-sm mb-6">
                Application Status
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={claimStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {claimStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {claimStatusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-gray-800 font-medium">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member Growth */}
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[#0A2A5E] font-semibold text-sm">
                  Member Growth
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  Cumulative members over time
                </p>
              </div>
              <TrendingUp size={16} className="text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={memberGrowthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#0A2A5E"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#0A2A5E",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pending Authorizations */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-amber-600" />
                <h3 className="text-[#0A2A5E] font-semibold text-sm">
                  Pending Authorizations
                </h3>
                {pendingPayments.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                    {pendingPayments.length}
                  </span>
                )}
              </div>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 pl-9 pr-3 py-1.5 rounded-md border border-gray-200 text-gray-700 text-xs placeholder-gray-400 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-colors"
                />
              </div>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-green-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  All caught up
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  No pending payments to authorize
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Method
                    </th>
                    <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Date
                    </th>
                    {/* <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Transaction ID
                    </th> */}
                    <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Sender Account
                    </th>
                    <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                    >
                      <td className="py-3.5 px-6">
                        <p className="text-[#0A2A5E] text-sm font-medium">
                          {p.user?.fullName || "Unknown"}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {p.user?.memberId}
                        </p>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs capitalize">
                          {p.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right text-[#0A2A5E] text-sm font-semibold">
                        {p.amount.toLocaleString()} BDT
                      </td>
                      <td className="py-3.5 px-6 text-right text-gray-500 text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {/* <td className="py-3.5 px-6 text-right text-gray-400 text-xs font-mono">
                        {p.transactionId}
                      </td> */}
                      <td className="py-3.5 px-6 text-right text-gray-400 text-xs font-mono">
                        {p.senderAccount || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleVerify(p.id)}
                          className="px-3 py-1.5 rounded-md bg-[#D32F2F] text-white text-xs font-medium hover:bg-[#b71c1c] transition-colors"
                        >
                          Authorize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Owner/Agent Dashboard */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                My Members
              </span>
              <Users size={16} className="text-blue-600" />
            </div>
            <p className="text-[#0A2A5E] text-2xl font-bold">
              {stats.members.total}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {stats.members.active} active
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Commission Earned
              </span>
              <Banknote size={16} className="text-green-600" />
            </div>
            <p className="text-[#0A2A5E] text-2xl font-bold">
              {(stats.commissions?.totalEarned || 0).toLocaleString()} BDT
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {(stats.commissions?.totalPaid || 0).toLocaleString()} BDT paid
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Sub-Agents
              </span>
              <UserCheck size={16} className="text-purple-600" />
            </div>
            <p className="text-[#0A2A5E] text-2xl font-bold">
              {stats.agents.total}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
