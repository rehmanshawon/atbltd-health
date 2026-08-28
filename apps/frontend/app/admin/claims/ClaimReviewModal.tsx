'use client';

import { Loader2, CheckCircle2, X, FileText, Paperclip, Eye } from 'lucide-react';

interface ClaimDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string | null;
  isVerified: boolean;
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
  createdAt: string;
  member?: { memberId: string; fullName: string; mobileNumber: string };
}

interface ClaimReviewModalProps {
  claim: Claim;
  claimDocuments: ClaimDocument[];
  loadingDocuments: boolean;
  reviewStatus: string;
  approvedAmount: string;
  rejectionReason: string;
  reviewNotes: string;
  actionLoading: boolean;
  statusColors: Record<string, { bg: string; text: string; border: string; label: string }>;
  onClose: () => void;
  onReviewStatusChange: (value: string) => void;
  onApprovedAmountChange: (value: string) => void;
  onRejectionReasonChange: (value: string) => void;
  onReviewNotesChange: (value: string) => void;
  onUpdateStatus: () => void;
}

export default function ClaimReviewModal({
  claim,
  claimDocuments,
  loadingDocuments,
  reviewStatus,
  approvedAmount,
  rejectionReason,
  reviewNotes,
  actionLoading,
  statusColors,
  onClose,
  onReviewStatusChange,
  onApprovedAmountChange,
  onRejectionReasonChange,
  onReviewNotesChange,
  onUpdateStatus,
}: ClaimReviewModalProps) {
  const formatCurrency = (amount: number) => `${amount?.toLocaleString() || 0} BDT`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const statusStyle = statusColors[claim.status] || statusColors.submitted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-blue">Review Application</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Member</p>
              <p className="text-brand-blue font-medium">{claim.member?.fullName}</p>
              <p className="text-gray-500 text-xs">
                {claim.member?.memberId} · {claim.member?.mobileNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Status</p>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border mt-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {statusStyle.label}
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Surgery Type</p>
              <p className="text-gray-700">{claim.surgeryType}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Hospital</p>
              <p className="text-gray-700">{claim.hospitalName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Admission Date</p>
              <p className="text-gray-700">{formatDate(claim.admissionDate)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase">Claimed Amount</p>
              <p className="text-brand-blue font-bold">{formatCurrency(claim.claimedAmount)}</p>
            </div>
          </div>

          {claim.notes && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Member Notes</p>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{claim.notes}</p>
            </div>
          )}

          {/* Documents */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase mb-2">
              Uploaded Documents {claimDocuments.length > 0 && `(${claimDocuments.length})`}
            </p>
            {loadingDocuments ? (
              <div className="py-4 text-center">
                <Loader2 size={18} className="animate-spin text-gray-400 mx-auto" />
              </div>
            ) : claimDocuments.length === 0 ? (
              <div className="py-4 text-center bg-gray-50 rounded-md">
                <Paperclip size={20} className="text-gray-300 mx-auto mb-1" />
                <p className="text-gray-400 text-xs">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {claimDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-gray-700 text-sm font-medium">{doc.documentType}</p>
                          {doc.isVerified && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-medium">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate">{doc.fileName}</p>
                        {doc.notes && <p className="text-gray-500 text-xs mt-0.5">{doc.notes}</p>}
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      className="text-brand-blue text-xs hover:underline shrink-0 ml-2"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Actions */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-500 text-sm font-semibold mb-3">Update Status</p>
            <div className="space-y-3">
              <select
                value={reviewStatus}
                onChange={(e) => onReviewStatusChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red"
              >
                <option value="">Select action...</option>
                <option value="under_review">Mark Under Review</option>
                <option value="document_required">Request Documents</option>
                <option value="hospital_verification">Send for Hospital Verification</option>
                <option value="approved">Approve Application</option>
                <option value="rejected">Reject Application</option>
                <option value="payment_processed">Mark Payment Settled</option>
              </select>

              {reviewStatus === 'approved' && (
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1">
                    Approved Amount (BDT)
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => onApprovedAmountChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red"
                  />
                </div>
              )}

              {reviewStatus === 'rejected' && (
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => onRejectionReasonChange(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red resize-none"
                    placeholder="Explain why this application is being rejected..."
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-500 text-xs font-medium mb-1">
                  Internal Notes (optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => onReviewNotesChange(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 text-gray-700 text-sm focus:outline-none focus:border-brand-red resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onUpdateStatus}
                  disabled={!reviewStatus || actionLoading}
                  className="px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {actionLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
