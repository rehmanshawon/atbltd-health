"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileSearch,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

const STATUS_CONFIG: Record<
  string,
  { icon: any; color: string; bg: string; label: string; desc: string }
> = {
  submitted: {
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Submitted",
    desc: "Your claim has been received",
  },
  under_review: {
    icon: FileSearch,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Under Review",
    desc: "Our team is reviewing your documents",
  },
  document_required: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Documents Required",
    desc: "Additional documents needed",
  },
  hospital_verification: {
    icon: FileSearch,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    label: "Hospital Verification",
    desc: "Verifying with hospital",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Approved",
    desc: "Your claim has been approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Rejected",
    desc: "Your claim was not approved",
  },
  payment_processed: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Payment Processed",
    desc: "Funds have been disbursed",
  },
};

interface Claim {
  id: string;
  surgeryType: string;
  hospitalName: string;
  claimedAmount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export default function MemberClaimsPage() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (token) loadClaims();
  }, [token]);

  const loadClaims = async () => {
    try {
      const res = await fetch(`${API_BASE}/claims/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClaims(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">My Claims</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track your submitted claims
          </p>
        </div>
        <Link
          href="/dashboard/claims/new"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors"
        >
          <Plus size={16} /> New Benefit Application
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md py-16 text-center">
          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No claims yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Submit your first claim to see it here
          </p>
          <Link
            href="/dashboard/claims/new"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-md bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors"
          >
            <Plus size={14} /> Submit a Benefit Application
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const statusStyle =
              STATUS_CONFIG[claim.status] || STATUS_CONFIG.submitted;
            const StatusIcon = statusStyle.icon;

            return (
              <div
                key={claim.id}
                onClick={() => router.push(`/dashboard/claims/${claim.id}`)}
                className="bg-white border border-gray-200 rounded-md p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-brand-blue font-semibold">
                        {claim.surgeryType}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}
                      >
                        <StatusIcon size={12} /> {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {claim.hospitalName}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Submitted {formatDate(claim.createdAt)}
                    </p>
                    {claim.rejectionReason && (
                      <div className="mt-2 p-2 rounded bg-red-50 text-red-700 text-xs">
                        {claim.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-brand-blue font-bold">
                      {formatCurrency(claim.claimedAmount)}
                    </p>
                    {claim.approvedAmount && (
                      <p className="text-green-600 text-xs mt-0.5">
                        Approved: {formatCurrency(claim.approvedAmount)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {[
                      "submitted",
                      "under_review",
                      "approved",
                      "payment_processed",
                    ].map((stage, idx) => {
                      const stageConfig = STATUS_CONFIG[stage];
                      const StageIcon = stageConfig.icon;
                      const isComplete = [
                        "approved",
                        "payment_processed",
                      ].includes(claim.status)
                        ? true
                        : ["submitted", "under_review"].includes(
                            claim.status,
                          ) && stage === claim.status;
                      const isCurrent = stage === claim.status;

                      return (
                        <div key={stage} className="flex items-center flex-1">
                          <div
                            className={`flex items-center gap-1.5 ${idx > 0 ? "flex-1" : ""}`}
                          >
                            {idx > 0 && (
                              <div
                                className={`flex-1 h-0.5 rounded ${isComplete || isCurrent ? "bg-brand-blue" : "bg-gray-200"}`}
                              />
                            )}
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isComplete
                                  ? "bg-brand-blue text-white"
                                  : isCurrent
                                    ? "bg-brand-blue/20 text-brand-blue border border-brand-blue"
                                    : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <StageIcon size={11} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {[
                      "submitted",
                      "under_review",
                      "approved",
                      "payment_processed",
                    ].map((stage) => (
                      <span key={stage} className="text-[10px] text-gray-400">
                        {STATUS_CONFIG[stage].label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
