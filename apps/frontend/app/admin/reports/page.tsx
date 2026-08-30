'use client';

import { useAuth } from '../../lib/auth-context';
import {
  FileText,
  Download,
  Users,
  Banknote,
  FileBarChart,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

export default function ReportsPage() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const reports = [
    {
      label: 'Member Report',
      desc: 'All members with status',
      icon: Users,
      endpoint: 'members',
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Payment Collection',
      desc: 'Verified payments summary',
      icon: Banknote,
      endpoint: 'payments',
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Benefit Applications',
      desc: 'Claims with status breakdown',
      icon: FileBarChart,
      endpoint: 'claims',
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Agent Performance',
      desc: 'Commission and member counts',
      icon: UserCheck,
      endpoint: 'agents',
      roles: ['super_admin', 'admin'],
    },
    {
      label: 'Audit Log Report',
      desc: 'System activity trail',
      icon: ShieldAlert,
      endpoint: 'audit',
      roles: ['super_admin'],
    },
  ];

  const downloadReport = async (endpoint: string) => {
    try {
      const res = await fetch(`${API_BASE}/reports/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${endpoint}-report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleReports = reports.filter((r) => r.roles.includes(user?.role || ''));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Reports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Download PDF reports for your review</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleReports.map((report) => (
          <div
            key={report.endpoint}
            className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-md bg-brand-blue/10">
                <report.icon size={20} className="text-brand-blue" />
              </div>
              <button
                onClick={() => downloadReport(report.endpoint)}
                className="p-2 rounded-md border border-gray-200 text-gray-500 hover:text-brand-red hover:border-brand-red transition-colors"
              >
                <Download size={16} />
              </button>
            </div>
            <h3 className="text-brand-blue font-semibold">{report.label}</h3>
            <p className="text-gray-500 text-xs mt-1">{report.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
