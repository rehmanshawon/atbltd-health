"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { ShieldAlert, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface FraudAlert {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  details: any;
}

const SEVERITY_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: any }
> = {
  high: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: AlertTriangle,
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  low: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: AlertTriangle,
  },
};

const TYPE_LABELS: Record<string, string> = {
  duplicate_nid: "Duplicate NID",
  duplicate_mobile: "Duplicate Mobile",
  duplicate_payment: "Duplicate Transaction",
  multiple_accounts_ip: "Multiple Accounts from IP",
  rapid_registrations: "Rapid Registrations",
};

export default function FraudPage() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadAlerts();
  }, [token]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/fraud-check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">
            Fraud Detection
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Automated fraud alerts & duplicate detection
          </p>
        </div>
        <button
          onClick={loadAlerts}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Run Checks
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            Total Alerts
          </p>
          <p className="text-brand-blue text-2xl font-bold mt-1">
            {alerts.length}
          </p>
        </div>
        <div className="bg-white border border-red-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            High Severity
          </p>
          <p className="text-red-600 text-2xl font-bold mt-1">{highCount}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            Medium Severity
          </p>
          <p className="text-amber-600 text-2xl font-bold mt-1">
            {mediumCount}
          </p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-500" />
          <span className="text-gray-700 text-sm font-medium">
            Detected Issues
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto"
            />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldAlert size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No issues detected</p>
            <p className="text-gray-400 text-sm mt-1">System is clean</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alerts.map((alert, i) => {
              const style = SEVERITY_STYLES[alert.severity];
              const Icon = style.icon;
              return (
                <div
                  key={i}
                  className={`px-5 py-3.5 flex items-start gap-3 ${style.bg}`}
                >
                  <Icon size={18} className={`${style.text} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${style.text} ${style.bg} border ${style.border}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {TYPE_LABELS[alert.type] || alert.type}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium">
                      {alert.message}
                    </p>
                    {alert.details?.users && (
                      <div className="mt-2 space-y-1">
                        {alert.details.users.map((u: any) => (
                          <p key={u.id} className="text-gray-500 text-xs">
                            • {u.fullName} ({u.memberId}) — {u.mobileNumber}
                          </p>
                        ))}
                      </div>
                    )}
                    {alert.details?.count && (
                      <p className="text-gray-500 text-xs mt-1">
                        Count: {alert.details.count}
                      </p>
                    )}
                    {alert.details?.ip && (
                      <p className="text-gray-500 text-xs mt-1">
                        IP: {alert.details.ip}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
