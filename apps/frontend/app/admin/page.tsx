'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { adminApi } from '../lib/api';
import { CheckCircle2, Loader2, Download } from 'lucide-react';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import PendingPaymentsTable from './components/PendingPaymentsTable';
import AgentDashboardCards from './components/AgentDashboardCards';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

interface AdminStats {
  members: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  payments: {
    totalCollection: number;
    pendingVerification: number;
    verifiedToday: number;
  };
  claims: {
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  agents: { total: number; active: number };
  commissions?: {
    totalEarned: number;
    totalPaid: number;
  };
}

interface PendingPayment {
  id: string;
  amount: number;
  method: string;
  senderAccount: string;
  status: string;
  createdAt: string;
  user?: { memberId: string; fullName: string; mobileNumber: string };
}

const defaultStats: AdminStats = {
  members: { total: 0, active: 0, inactive: 0, newThisMonth: 0 },
  payments: { totalCollection: 0, pendingVerification: 0, verifiedToday: 0 },
  claims: { submitted: 0, pending: 0, approved: 0, rejected: 0 },
  agents: { total: 0, active: 0 },
  commissions: { totalEarned: 0, totalPaid: 0 },
};

export default function AdminDashboard() {
  const { token, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isStaff = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    if (user && user.role === 'member') {
      router.replace('/dashboard');
      return;
    }
    if (token && isAuthenticated) {
      loadData();
    }
  }, [user, token, isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isStaff) {
        const [s, p] = await Promise.all([
          adminApi.getDashboard(token!),
          adminApi.getPendingPayments(token!),
        ]);
        setStats({ ...defaultStats, ...s });
        setPendingPayments(Array.isArray(p) ? p : []);
      } else {
        const res = await fetch(`${API_BASE}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats({
            members: {
              total: data.members?.total || 0,
              active: data.members?.active || 0,
              inactive: 0,
              newThisMonth: 0,
            },
            payments: {
              totalCollection: 0,
              pendingVerification: 0,
              verifiedToday: 0,
            },
            claims: { submitted: 0, pending: 0, approved: 0, rejected: 0 },
            agents: {
              total: data.agents?.total || 0,
              active: 0,
            },
            commissions: {
              totalEarned: data.commissions?.totalEarned || 0,
              totalPaid: data.commissions?.totalPaid || 0,
            },
          });
        } else {
          setStats(defaultStats);
        }
        setPendingPayments([]);
      }
    } catch (err) {
      console.error(err);
      setStats(defaultStats);
      setPendingPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await adminApi.verifyPayment(id, token!);
      setActionMsg({
        type: 'success',
        text: 'Payment authorized successfully',
      });
      await loadData();
    } catch {
      setActionMsg({ type: 'error', text: 'Authorization failed' });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-[#D32F2F] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A5E]">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isStaff ? "Monitor your organization's performance" : 'Your performance summary'}
          </p>
        </div>
        {isStaff && (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={14} />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium border ${
            actionMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          <CheckCircle2 size={15} /> {actionMsg.text}
        </div>
      )}

      {isStaff ? (
        <>
          <KpiCards stats={stats} />
          <ChartsSection />
          <PendingPaymentsTable payments={pendingPayments} onAuthorize={handleVerify} />
        </>
      ) : (
        <AgentDashboardCards stats={stats} />
      )}
    </div>
  );
}
