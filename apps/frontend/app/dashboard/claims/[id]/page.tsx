'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useClaimDetail, Claim, ClaimDocument, UploadEntry } from './useClaimDetail';
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  X,
  Plus,
  Eye,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

const DOCUMENT_TYPES = [
  'Discharge Summary',
  'Operation Theatre Note',
  'Doctor Prescription',
  'Paid Bill / Cash Memo',
  'Hospital Admission Form',
  'Diagnostic Report',
  'NID Copy',
  'Other',
];

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  under_review: 'bg-purple-50 text-purple-700 border-purple-200',
  document_required: 'bg-amber-50 text-amber-700 border-amber-200',
  hospital_verification: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  payment_processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  const [uploadEntries, setUploadEntries] = useState<UploadEntry[]>([
    { id: crypto.randomUUID(), documentType: '', file: null, notes: '' },
  ]);

  const { loadData, handleUpload } = useClaimDetail({
    id,
    token: token || '',
    setClaim,
    setDocuments,
    setError,
    setIsLoading,
    uploadEntries,
    setIsUploading,
    setUploadSuccess,
    setUploadEntries,
  });

  useEffect(() => {
    if (token && id) loadData();
  }, [token, id]);

  const addUploadEntry = () => {
    setUploadEntries([
      ...uploadEntries,
      { id: crypto.randomUUID(), documentType: '', file: null, notes: '' },
    ]);
  };

  const removeUploadEntry = (entryId: string) => {
    setUploadEntries(uploadEntries.filter((e) => e.id !== entryId));
  };

  const updateUploadEntry = (
    entryId: string,
    field: keyof UploadEntry,
    value: string | File | null,
  ) => {
    setUploadEntries(uploadEntries.map((e) => (e.id === entryId ? { ...e, [field]: value } : e)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Benefit Application not found</p>
        <Link href="/dashboard/claims" className="text-brand-blue text-sm mt-2 inline-block">
          Back to claims
        </Link>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const formatCurrency = (amount: number) => `${amount?.toLocaleString() || 0} BDT`;
  const isDocumentRequired = claim.status === 'document_required';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard/claims"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowLeft size={15} /> Back to claims
      </Link>

      {/* Claim Details Card */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-brand-blue">{claim.surgeryType}</h1>
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium border ${
              STATUS_COLORS[claim.status] || STATUS_COLORS.submitted
            }`}
          >
            {claim.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Hospital:</span>{' '}
            <span className="text-gray-700 ml-1">{claim.hospitalName}</span>
          </div>
          <div>
            <span className="text-gray-400">Admission:</span>{' '}
            <span className="text-gray-700 ml-1">{formatDate(claim.admissionDate)}</span>
          </div>
          {claim.operationDate && (
            <div>
              <span className="text-gray-400">Operation:</span>{' '}
              <span className="text-gray-700 ml-1">{formatDate(claim.operationDate)}</span>
            </div>
          )}
          {claim.doctorName && (
            <div>
              <span className="text-gray-400">Doctor:</span>{' '}
              <span className="text-gray-700 ml-1">{claim.doctorName}</span>
            </div>
          )}
          <div>
            <span className="text-gray-400">Claimed:</span>{' '}
            <span className="text-brand-blue font-semibold ml-1">
              {formatCurrency(claim.claimedAmount)}
            </span>
          </div>
          {claim.approvedAmount && (
            <div>
              <span className="text-gray-400">Approved:</span>{' '}
              <span className="text-green-600 font-semibold ml-1">
                {formatCurrency(claim.approvedAmount)}
              </span>
            </div>
          )}
        </div>

        {claim.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-gray-600 text-sm">{claim.notes}</div>
        )}

        {claim.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <strong>Rejection Reason:</strong> {claim.rejectionReason}
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold text-brand-blue mb-4">
          Uploaded Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <Paperclip size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No documents uploaded yet</p>
            {isDocumentRequired && (
              <p className="text-amber-600 text-xs mt-1">
                The review team has requested additional documents
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-gray-400 shrink-0" />
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
                  className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0 ml-2"
                  title="View file"
                >
                  <Eye size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload New Documents */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold text-brand-blue mb-1">Upload Documents</h2>
        <p className="text-gray-500 text-sm mb-4">
          Select document type and choose the file to upload
        </p>

        {uploadSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 size={15} /> Documents uploaded successfully!
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {uploadEntries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-md">
              <div className="flex-1 space-y-2">
                {/* Document Type Dropdown */}
                <select
                  value={entry.documentType}
                  onChange={(e) => updateUploadEntry(entry.id, 'documentType', e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-200 text-gray-700 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20"
                >
                  <option value="">Select document type...</option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* File Upload */}
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded border border-dashed cursor-pointer transition-colors ${
                        entry.file
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-500 hover:border-brand-red hover:text-brand-red'
                      }`}
                    >
                      <Upload size={16} />
                      <span className="text-sm truncate">
                        {entry.file ? entry.file.name : 'Click to choose file'}
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        updateUploadEntry(entry.id, 'file', file);
                      }}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </label>
                  {entry.file && (
                    <button
                      onClick={() => updateUploadEntry(entry.id, 'file', null)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Optional Notes */}
                <input
                  type="text"
                  value={entry.notes}
                  onChange={(e) => updateUploadEntry(entry.id, 'notes', e.target.value)}
                  placeholder="Optional notes about this document..."
                  className="w-full px-3 py-2 rounded border border-gray-200 text-gray-700 text-sm placeholder-gray-400 focus:border-brand-red focus:outline-none"
                />
              </div>

              {/* Remove entry button */}
              {uploadEntries.length > 1 && (
                <button
                  onClick={() => removeUploadEntry(entry.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0 mt-1"
                  title="Remove this entry"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={addUploadEntry}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} /> Add Another Document
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </div>
    </div>
  );
}
