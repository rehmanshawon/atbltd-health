"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { membershipApi } from "../../lib/api";
import {
  CreditCard,
  Copy,
  CheckCircle2,
  Loader2,
  Shield,
  Calendar,
} from "lucide-react";

export default function DigitalCardPage() {
  const { token } = useAuth();
  const [card, setCard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      membershipApi
        .getDashboard(token)
        .then((data: any) => setCard(data.digitalCard))
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Digital Membership Card
        </h1>
        <p className="text-neutral-400 text-sm mt-0.5">
          Your ATB membership identification
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#111b33] via-[#0d1529] to-[#0a1020] border border-white/[0.08] rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/4 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-400 text-[10px] font-semibold uppercase tracking-[0.2em]">
                ATB Ltd
              </p>
              <p className="text-white font-bold text-lg mt-0.5">
                Astha Treatment Bills
              </p>
            </div>
            <Shield size={28} className="text-red-400/60" />
          </div>

          <div>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider">
              Member
            </p>
            <p className="text-white font-semibold text-lg mt-0.5">
              {card?.fullName}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">
                Membership ID
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-white font-mono text-xl font-bold tracking-wider">
                  {card?.memberId}
                </p>
                <button
                  onClick={() => copyId(card?.memberId || "")}
                  className="p-1 rounded-md hover:bg-white/5 transition-colors text-neutral-500 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-neutral-500 text-[10px] uppercase tracking-wider">
                Valid Until
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar size={13} className="text-neutral-500" />
                <p className="text-white text-sm font-medium">
                  {card?.validUntil
                    ? new Date(card.validUntil).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-neutral-500 text-xs">Member</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                card?.isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {card?.isActive ? "Active" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      <p className="text-neutral-600 text-xs text-center">
        Show this card or provide your Membership ID to access ATB services
      </p>
    </div>
  );
}
