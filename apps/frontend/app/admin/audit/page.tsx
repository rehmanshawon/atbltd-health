"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  ShieldAlert,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  newValue: any;
  oldValue: any;
  ipAddress: string | null;
  createdAt: string;
  performedBy?: {
    memberId: string;
    fullName: string;
  } | null;
}

const ACTION_COLORS: Record<string, string> = {
  USER_REGISTERED: "bg-blue-50 text-blue-700",
  PAYMENT_VERIFIED: "bg-green-50 text-green-700",
  CLAIM_SUBMITTED: "bg-purple-50 text-purple-700",
  CLAIM_UNDER_REVIEW: "bg-indigo-50 text-indigo-700",
  CLAIM_APPROVED: "bg-emerald-50 text-emerald-700",
  CLAIM_REJECTED: "bg-red-50 text-red-700",
  CLAIM_PAYMENT_PROCESSED: "bg-teal-50 text-teal-700",
  COMMISSION_CREATED: "bg-amber-50 text-amber-700",
  COMMISSION_PAID: "bg-green-50 text-green-700",
  COMMISSION_REVERSED: "bg-red-50 text-red-700",
};

export default function AuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadLogs();
  }, [token, page]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/audit-logs?page=${page}&limit=30`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Track all system activities and changes
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <span className="text-gray-700 text-sm font-medium">
              Activity Log
            </span>
            <span className="text-gray-400 text-xs">({total} entries)</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto mb-3"
            />
            <p className="text-gray-500 text-sm">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldAlert size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {logs.map((log) => {
                const actionStyle =
                  ACTION_COLORS[log.action] || "bg-gray-50 text-gray-600";
                return (
                  <div
                    key={log.id}
                    className="px-5 py-3 flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Action badge */}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${actionStyle}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">
                          {log.entity}
                        </span>
                        {log.entityId && (
                          <span className="text-gray-300 text-[10px] font-mono">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      {log.newValue && (
                        <p className="text-gray-700 text-sm mt-0.5 truncate">
                          {typeof log.newValue === "object"
                            ? JSON.stringify(log.newValue).substring(0, 120)
                            : String(log.newValue).substring(0, 120)}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-right shrink-0">
                      <p className="text-gray-500 text-xs">
                        {log.performedBy?.fullName ||
                          log.performedBy?.memberId ||
                          "System"}
                      </p>
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {formatDate(log.createdAt)}
                      </p>
                      {log.ipAddress && (
                        <p className="text-gray-300 text-[10px]">
                          {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-gray-500 text-xs">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 rounded text-gray-500 text-xs hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 rounded text-gray-500 text-xs hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
