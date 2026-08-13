"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface Surgery {
  id: string;
  nameEn: string;
  nameBn: string;
  category: string;
}

interface Hospital {
  id: string;
  name: string;
  address: string;
}

export default function NewClaimPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const [form, setForm] = useState({
    surgeryType: "",
    hospitalName: "",
    admissionDate: "",
    operationDate: "",
    doctorName: "",
    claimedAmount: "",
    notes: "",
  });

  useEffect(() => {
    if (token) {
      Promise.all([
        fetch(`${API_BASE}/surgeries?covered=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${API_BASE}/hospitals`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ])
        .then(([surgeriesData, hospitalsData]) => {
          setSurgeries(Array.isArray(surgeriesData) ? surgeriesData : []);
          setHospitals(Array.isArray(hospitalsData) ? hospitalsData : []);
        })
        .catch(console.error)
        .finally(() => setIsLoadingDropdowns(false));
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const selectedSurgery = surgeries.find((s) => s.id === form.surgeryType);
      const selectedHospital = hospitals.find(
        (h) => h.id === form.hospitalName,
      );

      const response = await fetch(`${API_BASE}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          surgeryType: selectedSurgery?.nameEn || form.surgeryType,
          hospitalName: selectedHospital?.name || form.hospitalName,
          admissionDate: form.admissionDate,
          operationDate: form.operationDate || undefined,
          doctorName: form.doctorName || undefined,
          claimedAmount: parseFloat(form.claimedAmount),
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to submit claim");

      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard/claims"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-green-600" />
        </div>
        <h2 className="text-brand-blue text-xl font-bold">Claim Submitted</h2>
        <p className="text-gray-500 text-sm mt-1">
          Your claim is being reviewed. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard/claims"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowLeft size={15} /> Back to claims
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Submit a Claim</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Request financial assistance for eligible medical treatment
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoadingDropdowns ? (
        <div className="py-12 text-center">
          <Loader2
            size={24}
            className="animate-spin text-brand-red mx-auto mb-2"
          />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-md p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Surgery Type *
              </label>
              <select
                required
                value={form.surgeryType}
                onChange={(e) =>
                  setForm({ ...form, surgeryType: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="">Select surgery type...</option>
                {surgeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameEn} ({s.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Hospital Name *
              </label>
              <select
                required
                value={form.hospitalName}
                onChange={(e) =>
                  setForm({ ...form, hospitalName: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="">Select hospital...</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Admission Date *
              </label>
              <input
                type="date"
                required
                value={form.admissionDate}
                onChange={(e) =>
                  setForm({ ...form, admissionDate: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                Operation Date
              </label>
              <input
                type="date"
                value={form.operationDate}
                onChange={(e) =>
                  setForm({ ...form, operationDate: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 [color-scheme:light]"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Doctor Name
            </label>
            <input
              value={form.doctorName}
              onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
              placeholder="e.g., Dr. Rahman"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Claimed Amount (BDT) *
            </label>
            <input
              type="number"
              required
              value={form.claimedAmount}
              onChange={(e) =>
                setForm({ ...form, claimedAmount: e.target.value })
              }
              placeholder="e.g., 5000"
              min="1"
              max="12000"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20"
            />
            <p className="text-gray-400 text-[11px] mt-1">
              Maximum: 12,000 BDT per year
            </p>
          </div>

          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Additional Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information..."
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red/20 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50 border border-gray-100">
            <Upload size={16} className="text-gray-400 shrink-0" />
            <p className="text-gray-500 text-xs">
              Document upload will be available after initial submission.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/dashboard/claims"
              className="px-4 py-2.5 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {isSubmitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
