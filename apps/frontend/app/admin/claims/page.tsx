'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  FileText,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import ClaimReviewModal from './ClaimReviewModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  submitted: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Submitted',
  },
  under_review: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Under Review',
  },
  document_required: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Documents Required',
  },
  hospital_verification: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    label: 'Hospital Verification',
  },
  approved: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    label: 'Approved',
  },
  rejected: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Rejected',
  },
  payment_processed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Payment Settled',
  },
};

interface ClaimDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string | null;
  isVerified: boolean;
  createdAt: string;
}

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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [claimDocuments, setClaimDocuments] = useState<ClaimDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (token) loadClaims();
  }, [token, page, statusFilter]);

  const loadClaims = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      params.set('limit', '15');

      const res = await fetch(`${API_BASE}/claims?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClaims(data.claims || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = async (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewStatus('');
    setApprovedAmount(claim.claimedAmount?.toString() || '');
    setRejectionReason('');
    setReviewNotes('');
    setActionMsg(null);
    setClaimDocuments([]);
    setLoadingDocuments(true);

    try {
      const res = await fetch(`${API_BASE}/claims/${claim.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docs = await res.json();
      setClaimDocuments(Array.isArray(docs) ? docs : []);
    } catch {
      setClaimDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedClaim || !reviewStatus) return;
    setActionLoading(true);
    setActionMsg(null);

    try {
      const body: any = { status: reviewStatus };
      if (reviewStatus === 'approved') body.approvedAmount = parseFloat(approvedAmount);
      if (reviewStatus === 'rejected') body.rejectionReason = rejectionReason;
      if (reviewNotes) body.notes = reviewNotes;

      const res = await fetch(`${API_BASE}/claims/${selectedClaim.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionMsg({ type: 'error', text: data.message || 'Update failed' });
        setActionLoading(false);
        return;
      }

      setClaims((prev) => prev.map((c) => (c.id === selectedClaim.id ? { ...c, ...data } : c)));

      setSelectedClaim(null);
      setActionMsg({
        type: 'success',
        text: `Application ${reviewStatus.replace(/_/g, ' ')} successfully`,
      });

      setTimeout(() => {
        setActionMsg(null);
        loadClaims();
      }, 1500);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `${amount?.toLocaleString() || 0} BDT`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Applications of Benefits</h1>
          <p className="text-gray-500 text-sm mt-0.5">Review and manage application submissions</p>
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
            actionMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {actionMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {actionMsg.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin text-brand-red mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading applications...</p>
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
                  const statusStyle = STATUS_COLORS[claim.status] || STATUS_COLORS.submitted;
                  return (
                    <tr
                      key={claim.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}
                    >
                      <td className="py-3 px-5">
                        <p className="text-brand-blue text-sm font-medium">
                          {claim.member?.fullName || '—'}
                        </p>
                        <p className="text-gray-400 text-xs">{claim.member?.memberId}</p>
                      </td>
                      <td className="py-3 px-5 text-gray-700 text-sm">{claim.surgeryType}</td>
                      <td className="py-3 px-5 text-gray-600 text-sm">{claim.hospitalName}</td>
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

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-gray-500 text-xs">
                Showing {claims.length} of {total} applications
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
        <ClaimReviewModal
          claim={selectedClaim}
          claimDocuments={claimDocuments}
          loadingDocuments={loadingDocuments}
          reviewStatus={reviewStatus}
          approvedAmount={approvedAmount}
          rejectionReason={rejectionReason}
          reviewNotes={reviewNotes}
          actionLoading={actionLoading}
          statusColors={STATUS_COLORS}
          onClose={() => setSelectedClaim(null)}
          onReviewStatusChange={setReviewStatus}
          onApprovedAmountChange={setApprovedAmount}
          onRejectionReasonChange={setRejectionReason}
          onReviewNotesChange={setReviewNotes}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
}
