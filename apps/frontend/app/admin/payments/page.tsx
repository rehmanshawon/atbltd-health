"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { adminApi } from "../../lib/api";
import { Banknote, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import AdminTable from "../components/AdminTable";

interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionId: string;
  status: string;
  paymentType: string;
  createdAt: string;
  user?: { memberId: string; fullName: string };
}

export default function PaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadPayments();
  }, [token, page, statusFilter]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getPayments(
        token!,
        statusFilter || undefined,
        Number(page),
      );
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Payments</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          View and verify payment transactions
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-3 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Banknote size={16} className="text-gray-400" />
            <span className="text-gray-700 text-sm font-medium">
              All Payments
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
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto"
            />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No payments found
          </div>
        ) : (
          <AdminTable minWidth={960}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Member
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Type
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Method
                </th>
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Amount
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  TXN ID
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                >
                  <td className="py-2.5 px-4">
                    <p className="text-brand-blue text-sm font-medium">
                      {p.user?.fullName || "—"}
                    </p>
                    <p className="text-gray-400 text-xs">{p.user?.memberId}</p>
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs capitalize">
                    {p.paymentType?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm capitalize">
                    {p.method}
                  </td>
                  <td className="py-2.5 px-4 text-right text-gray-800 text-sm font-semibold">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === "verified"
                          ? "bg-green-50 text-green-700"
                          : p.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : p.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-400 text-xs font-mono">
                    {p.transactionId}
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs">
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
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
