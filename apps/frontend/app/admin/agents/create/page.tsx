"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

export default function CreateAgentPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // If current user is an Owner, auto-set parentAgentCode to their own code
  const isOwnerCreating = user?.role === "owner";

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    commissionRate: "10",
    parentAgentCode: isOwnerCreating ? user?.memberId || "" : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.parentAgentCode) {
      setError("Please enter the Parent Owner's Agent Code");
      return;
    }

    setIsSubmitting(true);

    try {
      const body: any = {
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        email: form.email || undefined,
        role: "agent",
        commissionRate: parseFloat(form.commissionRate),
        parentAgentCode: isOwnerCreating
          ? user?.memberId
          : form.parentAgentCode,
      };

      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create agent");

      setSuccess(
        `Agent created successfully! Agent Code: ${data.agent?.agentCode}`,
      );
      setForm({
        fullName: "",
        mobileNumber: "",
        email: "",
        commissionRate: "10",
        parentAgentCode: isOwnerCreating ? user?.memberId || "" : "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowLeft size={15} /> Back to agents
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Create Agent</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Add a new agent to the network
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-md p-6 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Full Name *
            </label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm focus:border-brand-red focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Mobile Number *
            </label>
            <input
              required
              value={form.mobileNumber}
              onChange={(e) =>
                setForm({ ...form, mobileNumber: e.target.value })
              }
              placeholder="01XXXXXXXXX"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm focus:border-brand-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm focus:border-brand-red focus:outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Commission Rate (%) *
            </label>
            <input
              type="number"
              required
              value={form.commissionRate}
              onChange={(e) =>
                setForm({ ...form, commissionRate: e.target.value })
              }
              min="0"
              max="100"
              step="0.5"
              className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm focus:border-brand-red focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-xs font-semibold mb-1.5">
              Parent Owner (Agent Code) *
            </label>
            {isOwnerCreating ? (
              <div className="relative">
                <input
                  value={form.parentAgentCode}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-sm focus:outline-none cursor-not-allowed pr-10"
                />
                <Lock
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            ) : (
              <input
                required
                value={form.parentAgentCode}
                onChange={(e) =>
                  setForm({ ...form, parentAgentCode: e.target.value })
                }
                placeholder="e.g., ATB-26-OW-1"
                className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-gray-900 text-sm focus:border-brand-red focus:outline-none"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/admin/agents"
            className="px-4 py-2.5 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            {isSubmitting ? "Creating..." : "Create Agent"}
          </button>
        </div>
      </form>
    </div>
  );
}
