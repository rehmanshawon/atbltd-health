"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileSearch,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  submitted: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Submitted",
  },
  under_review: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    label: "Under Review",
  },
  document_required: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Documents Required",
  },
  hospital_verification: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    label: "Hospital Verification",
  },
  approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Rejected",
  },
  payment_processed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Payment Settled",
  },
};

interface Claim {
  id: string;
  memberId: string;
  surgeryType: string;
  hospitalName: string;
  admissionDate: string;
  claimedAmount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  documents: string[] | null;
  createdAt: string;
  member?: { memberId: string; fullName: string; mobileNumber: string };
}

export default function AdminClaimsPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (token) loadClaims();
  }, [token, page, statusFilter]);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`${API_BASE}/claims?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClaims(data.claims || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewStatus("");
    setApprovedAmount(claim.claimedAmount?.toString() || "");
    setRejectionReason("");
    setReviewNotes("");
    setActionMsg(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedClaim || !reviewStatus) return;
    setActionLoading(true);
    setActionMsg(null);

    try {
      const body: any = { status: reviewStatus };
      if (reviewStatus === "approved")
        body.approvedAmount = parseFloat(approvedAmount);
      if (reviewStatus === "rejected") body.rejectionReason = rejectionReason;
      if (reviewNotes) body.notes = reviewNotes;

      const res = await fetch(`${API_BASE}/claims/${selectedClaim.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the error from the backend (e.g., Maker-Checker message)
        setActionMsg({ type: "error", text: data.message || "Update failed" });
        setActionLoading(false);
        return;
      }

      // Success — update the claim in the list immediately
      setClaims((prev) =>
        prev.map((c) => (c.id === selectedClaim.id ? { ...c, ...data } : c)),
      );

      // Close modal and refresh from server
      setSelectedClaim(null);
      setActionMsg({
        type: "success",
        text: `Claim ${reviewStatus.replace(/_/g, " ")} successfully`,
      });

      // Refresh the full list after a short delay
      setTimeout(() => {
        setActionMsg(null);
        loadClaims();
      }, 1500);
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setActionLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-brand-blue">
            Applications of Benefits
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and manage application submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm bg-white focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_COLORS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
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
            <AlertCircle size={15} />
          )}
          {actionMsg.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto mb-3"
            />
            <p className="text-gray-500 text-sm">Loading claims...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="py-16 text-center">
            <FileSearch size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No applications found</p>
            <p className="text-gray-400 text-sm mt-1">
              Applications submitted by members will appear here
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Member
                  </th>
                  <th className="text-left py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Surgery
                  </th>
                  <th className="text-left py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Hospital
                  </th>
                  <th className="text-right py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Amount
                  </th>
                  <th className="text-left py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Date
                  </th>
                  <th className="text-right py-3 px-5 text-gray-500 text-xs font-semibold uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, i) => {
                  const statusStyle =
                    STATUS_COLORS[claim.status] || STATUS_COLORS.submitted;
                  return (
                    <tr
                      key={claim.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                    >
                      <td className="py-3 px-5">
                        <p className="text-brand-blue text-sm font-medium">
                          {claim.member?.fullName || "—"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {claim.member?.memberId}
                        </p>
                      </td>
                      <td className="py-3 px-5 text-gray-700 text-sm">
                        {claim.surgeryType}
                      </td>
                      <td className="py-3 px-5 text-gray-600 text-sm">
                        {claim.hospitalName}
                      </td>
                      <td className="py-3 px-5 text-right text-brand-blue text-sm font-semibold">
                        {formatCurrency(claim.claimedAmount)}
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-500 text-xs">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => openReview(claim)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-blue text-white text-xs font-medium hover:bg-brand-blue/90 transition-colors"
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-gray-500 text-xs">
                Showing {claims.length} of {total} claims
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-gray-500 text-xs hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 py-1 text-gray-700 text-xs font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded text-gray-500 text-xs hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedClaim(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-brand-blue">
                Review Claim
              </h2>
              <button
                onClick={() => setSelectedClaim(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Claim Details */}
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Member
                  </p>
                  <p className="text-brand-blue font-medium">
                    {selectedClaim.member?.fullName}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {selectedClaim.member?.memberId} ·{" "}
                    {selectedClaim.member?.mobileNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Status
                  </p>
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border mt-1 ${STATUS_COLORS[selectedClaim.status]?.bg} ${STATUS_COLORS[selectedClaim.status]?.text} ${STATUS_COLORS[selectedClaim.status]?.border}`}
                  >
                    {STATUS_COLORS[selectedClaim.status]?.label}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Surgery Type
                  </p>
                  <p className="text-gray-700">{selectedClaim.surgeryType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Hospital
                  </p>
                  <p className="text-gray-700">{selectedClaim.hospitalName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Admission Date
                  </p>
                  <p className="text-gray-700">
                    {formatDate(selectedClaim.admissionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase">
                    Claimed Amount
                  </p>
                  <p className="text-brand-blue font-bold">
                    {formatCurrency(selectedClaim.claimedAmount)}
                  </p>
                </div>
              </div>

              {selectedClaim.notes && (
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">
                    Member Notes
                  </p>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">
                    {selectedClaim.notes}
                  </p>
                </div>
              )}

              {selectedClaim.documents &&
                selectedClaim.documents.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">
                      Documents ({selectedClaim.documents.length})
                    </p>
                    <div className="space-y-1">
                      {selectedClaim.documents.map((doc, i) => (
                        <a
                          key={i}
                          href={doc}
                          target="_blank"
                          className="block text-brand-blue text-sm hover:underline"
                        >
                          {doc.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              {/* Review Actions */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-500 text-sm font-semibold mb-3">
                  Update Status
                </p>
                <div className="space-y-3">
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red"
                  >
                    <option value="">Select action...</option>
                    <option value="under_review">Mark Under Review</option>
                    <option value="document_required">Request Documents</option>
                    <option value="hospital_verification">
                      Send for Hospital Verification
                    </option>
                    <option value="approved">Approve Claim</option>
                    <option value="rejected">Reject Claim</option>
                    <option value="payment_processed">
                      Mark Payment Settled
                    </option>
                  </select>

                  {reviewStatus === "approved" && (
                    <div>
                      <label className="block text-gray-500 text-xs font-medium mb-1">
                        Approved Amount (BDT)
                      </label>
                      <input
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red"
                      />
                    </div>
                  )}

                  {reviewStatus === "rejected" && (
                    <div>
                      <label className="block text-gray-500 text-xs font-medium mb-1">
                        Rejection Reason
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red resize-none"
                        placeholder="Explain why this claim is being rejected..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-500 text-xs font-medium mb-1">
                      Internal Notes (optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setSelectedClaim(null)}
                      className="px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!reviewStatus || actionLoading}
                      className="px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      {actionLoading ? "Updating..." : "Update Status"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
