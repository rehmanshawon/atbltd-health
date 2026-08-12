"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  Banknote,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  reversed: "bg-red-50 text-red-700 border-red-200",
};

interface Commission {
  id: string;
  agentCode: string;
  memberCode: string;
  commissionType: string;
  registrationAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  agent?: { user?: { fullName: string } };
  member?: { fullName: string; memberId: string };
}

export default function CommissionsPage() {
  const { token } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Summary stats
  const [summary, setSummary] = useState({
    totalEarned: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  useEffect(() => {
    if (token) loadCommissions();
  }, [token, page, statusFilter]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`${API_BASE}/commissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCommissions(data.commissions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      // Calculate summary from displayed data
      const earned = (data.commissions || []).reduce(
        (sum: number, c: Commission) => sum + Number(c.commissionAmount),
        0,
      );
      const paid = (data.commissions || [])
        .filter((c: Commission) => c.status === "paid")
        .reduce(
          (sum: number, c: Commission) => sum + Number(c.commissionAmount),
          0,
        );
      setSummary({
        totalEarned: earned,
        totalPaid: paid,
        totalPending: earned - paid,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/commissions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      setActionMsg({ type: "success", text: "Commission approved" });
      loadCommissions();
    } catch {
      setActionMsg({ type: "error", text: "Approval failed" });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/commissions/${id}/confirm-payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      setActionMsg({ type: "success", text: "Payment confirmed" });
      loadCommissions();
    } catch (err: any) {
      setActionMsg({
        type: "error",
        text: err.message || "Confirmation failed",
      });
    }
    setTimeout(() => setActionMsg(null), 3000);
  };

  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Commissions</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Agent commission management & payouts
          </p>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium border ${
            actionMsg.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {actionMsg.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <XCircle size={15} />
          )}
          {actionMsg.text}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Earned",
            value: formatCurrency(summary.totalEarned),
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Paid",
            value: formatCurrency(summary.totalPaid),
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Pending Payout",
            value: formatCurrency(summary.totalPending),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
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

      {/* Commissions Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Banknote size={16} className="text-gray-400" />
            <span className="text-gray-700 text-sm font-medium">
              All Commissions
            </span>
            <span className="text-gray-400 text-xs">({total})</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 text-xs"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto"
            />
          </div>
        ) : commissions.length === 0 ? (
          <div className="py-16 text-center">
            <Banknote size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No commissions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Agent
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Member
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Type
                </th>
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Rate
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
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                >
                  <td className="py-3 px-4 text-brand-blue text-sm font-medium">
                    {c.agentCode}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {c.memberCode || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs capitalize">
                    {c.commissionType.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 text-sm">
                    {c.commissionRate}%
                  </td>
                  <td className="py-3 px-4 text-right text-brand-blue text-sm font-semibold">
                    {formatCurrency(c.commissionAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[c.status] || STATUS_COLORS.pending}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.status === "pending" && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="px-2 py-1 rounded bg-brand-blue text-white text-[11px] font-medium hover:bg-brand-blue/90"
                        >
                          Approve
                        </button>
                      )}
                      {c.status === "approved" && (
                        <button
                          onClick={() => handleConfirmPayment(c.id)}
                          className="px-2 py-1 rounded bg-green-600 text-white text-[11px] font-medium hover:bg-green-700"
                        >
                          Confirm Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-gray-500 text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
