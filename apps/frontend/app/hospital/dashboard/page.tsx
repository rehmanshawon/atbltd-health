"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  LogOut,
  Paperclip,
  Eye,
} from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface Claim {
  id: string;
  surgeryType: string;
  hospitalName: string;
  claimedAmount: number;
  status: string;
  createdAt: string;
  member?: { fullName: string; memberId: string; mobileNumber: string };
}

interface ClaimDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string | null;
  isVerified: boolean;
  createdAt: string;
}

export default function HospitalDashboard() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState("");
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedClaimDocs, setSelectedClaimDocs] = useState<ClaimDocument[]>(
    [],
  );
  const [showDocsFor, setShowDocsFor] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const loadDocuments = async (claimId: string) => {
    const token = localStorage.getItem("hospital_token");
    if (!token) return;

    // Toggle off if already showing
    if (showDocsFor === claimId) {
      setShowDocsFor(null);
      return;
    }

    setShowDocsFor(claimId);
    setLoadingDocs(true);

    try {
      const res = await fetch(
        `${API_BASE}/hospitals/claims/${claimId}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const docs = await res.json();
      setSelectedClaimDocs(Array.isArray(docs) ? docs : []);
    } catch {
      setSelectedClaimDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("hospital_token");
    const hospitalData = localStorage.getItem("hospital_data");

    if (!token || !hospitalData) {
      router.replace("/hospital/login");
      return;
    }

    const hospital = JSON.parse(hospitalData);
    setHospitalName(hospital.name);
    loadClaims(token);
  }, []);

  const loadClaims = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/hospitals/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (
    claimId: string,
    decision: "verified" | "rejected",
  ) => {
    const token = localStorage.getItem("hospital_token");
    if (!token) return;

    setVerifyingId(claimId);
    setActionMsg(null);

    try {
      const res = await fetch(
        `${API_BASE}/hospitals/claims/${claimId}/verify`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ decision, notes: verificationNotes }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }

      setActionMsg({
        type: "success",
        text: `Application ${decision === "verified" ? "verified" : "rejected"} successfully`,
      });
      setVerificationNotes("");
      setShowDocsFor(null);
      await loadClaims(token);
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hospital_token");
    localStorage.removeItem("hospital_data");
    router.replace("/hospital/login");
  };

  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#D32F2F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-[#0A2A5E]" />
            <div>
              <h1 className="text-[#0A2A5E] font-bold">{hospitalName}</h1>
              <p className="text-gray-500 text-xs">Hospital Partner Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0A2A5E]">
            Applications for Verification
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and verify patient applications assigned to your hospital
          </p>
        </div>

        {actionMsg && (
          <div
            className={`mb-4 p-3.5 rounded-md text-sm border ${
              actionMsg.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {actionMsg.text}
          </div>
        )}

        {claims.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-md py-16 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              No applications to verify
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Applications will appear here when ATB sends them for hospital
              verification
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white border border-gray-200 rounded-md p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[#0A2A5E] font-semibold">
                        {claim.surgeryType}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs border border-indigo-200">
                        Hospital Verification
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {claim.hospitalName}
                    </p>
                  </div>
                  <p className="text-[#0A2A5E] font-bold">
                    {formatCurrency(claim.claimedAmount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-400">Patient:</span>{" "}
                    <span className="text-gray-700">
                      {claim.member?.fullName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Member ID:</span>{" "}
                    <span className="text-gray-700">
                      {claim.member?.memberId}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mobile:</span>{" "}
                    <span className="text-gray-700">
                      {claim.member?.mobileNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Submitted:</span>{" "}
                    <span className="text-gray-700">
                      {formatDate(claim.createdAt)}
                    </span>
                  </div>
                </div>

                {/* View Documents Toggle */}
                <div className="mb-3">
                  <button
                    onClick={() => loadDocuments(claim.id)}
                    className="inline-flex items-center gap-1.5 text-brand-blue text-xs font-medium hover:underline"
                  >
                    <Paperclip size={13} />
                    {showDocsFor === claim.id
                      ? "Hide Documents"
                      : "View Documents"}
                  </button>

                  {/* Documents list */}
                  {showDocsFor === claim.id && (
                    <div className="mt-3 space-y-2">
                      {loadingDocs ? (
                        <div className="py-4 text-center">
                          <Loader2
                            size={18}
                            className="animate-spin text-gray-400 mx-auto"
                          />
                        </div>
                      ) : selectedClaimDocs.length === 0 ? (
                        <div className="py-4 text-center bg-gray-50 rounded-md">
                          <p className="text-gray-400 text-xs">
                            No documents uploaded
                          </p>
                        </div>
                      ) : (
                        selectedClaimDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText
                                size={14}
                                className="text-gray-400 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-700 text-xs font-medium">
                                    {doc.documentType}
                                  </p>
                                  {doc.isVerified && (
                                    <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-medium">
                                      <CheckCircle2 size={9} /> Verified
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-400 text-[10px] truncate">
                                  {doc.fileName}
                                </p>
                                {doc.notes && (
                                  <p className="text-gray-500 text-[10px] mt-0.5">
                                    {doc.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              className="text-brand-blue text-[10px] hover:underline shrink-0 ml-2"
                            >
                              View
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Notes input */}
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Verification notes (e.g., Patient confirmed admitted on stated date)"
                  rows={2}
                  className="w-full px-3 py-2 rounded border border-gray-200 text-gray-700 text-sm placeholder-gray-400 focus:border-[#D32F2F] focus:outline-none resize-none mb-3"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(claim.id, "verified")}
                    disabled={verifyingId === claim.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> Verify
                  </button>
                  <button
                    onClick={() => handleVerify(claim.id, "rejected")}
                    disabled={verifyingId === claim.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={13} /> Reject
                  </button>
                  {verifyingId === claim.id && (
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
