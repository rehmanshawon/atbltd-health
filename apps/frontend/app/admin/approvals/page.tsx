'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Loader2 } from 'lucide-react';
import AdminTable from '../components/AdminTable';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

interface PendingAgent {
  id: string;
  agentCode: string;
  approvalStatus: string;
  isActive: boolean;
  user?: {
    fullName: string;
    mobileNumber: string;
    memberId: string;
    role: string;
  };
  parentAgent?: { agentCode: string };
}

export default function ApprovalsPage() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const [pendingCreates, setPendingCreates] = useState<PendingAgent[]>([]);
  const [pendingDeactivations, setPendingDeactivations] = useState<PendingAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (token) loadPending();
  }, [token]);

  const loadPending = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents/pending-approvals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPendingCreates(data.pendingCreates || []);
      setPendingDeactivations(data.pendingDeactivations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetch(`${API_BASE}/agents/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionMsg('Approved successfully');
      await loadPending();
    } catch {
      setActionMsg('Approval failed');
    }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleApproveDeactivation = async (id: string) => {
    try {
      await fetch(`${API_BASE}/agents/${id}/approve-deactivation`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setActionMsg('Deactivation approved');
      await loadPending();
    } catch {
      setActionMsg('Failed');
    }
    setTimeout(() => setActionMsg(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">
          {isSuperAdmin ? 'Final Approvals' : 'Pending Checks'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {isSuperAdmin
            ? 'Items approved by Admin awaiting your final approval'
            : 'Items awaiting your check before forwarding to Super Admin'}
        </p>
      </div>

      {actionMsg && (
        <div className="p-3.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Pending Creates */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-gray-700 text-sm font-semibold">
            Pending Creations ({pendingCreates.length})
          </h2>
        </div>
        {pendingCreates.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Nothing pending</div>
        ) : (
          <AdminTable minWidth={860}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Code
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Role
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Parent
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingCreates.map((agent) => (
                <tr key={agent.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-mono">
                    {agent.agentCode}
                  </td>
                  <td className="py-2.5 px-4 text-gray-800 text-sm">{agent.user?.fullName}</td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm capitalize">
                    {agent.user?.role}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm">
                    {agent.parentAgent?.agentCode || '—'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                      {agent.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleApprove(agent.id)}
                      className="px-3 py-1.5 rounded bg-brand-blue text-white text-xs font-medium hover:bg-brand-blue/90"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>

      {/* Pending Deactivations */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-gray-700 text-sm font-semibold">
            Pending Deactivations ({pendingDeactivations.length})
          </h2>
        </div>
        {pendingDeactivations.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Nothing pending</div>
        ) : (
          <AdminTable minWidth={640}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Code
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-right py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingDeactivations.map((agent) => (
                <tr key={agent.id} className="border-b border-gray-50">
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-mono">
                    {agent.agentCode}
                  </td>
                  <td className="py-2.5 px-4 text-gray-800 text-sm">{agent.user?.fullName}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-red-50 text-red-700">
                      {agent.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleApproveDeactivation(agent.id)}
                      className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                    >
                      Approve Deactivation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>
    </div>
  );
}
