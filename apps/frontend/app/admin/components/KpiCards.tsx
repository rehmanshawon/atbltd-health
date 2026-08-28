'use client';

import { Users, Banknote, FileText, UserCheck, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface AdminStats {
  members: { total: number; active: number; inactive: number; newThisMonth: number };
  payments: { totalCollection: number; pendingVerification: number; verifiedToday: number };
  claims: { submitted: number; pending: number; approved: number; rejected: number };
  agents: { total: number; active: number };
}

export default function KpiCards({ stats }: { stats: AdminStats }) {
  const kpiData = [
    {
      label: 'Total Members',
      value: stats.members.total.toLocaleString(),
      change: `+${stats.members.newThisMonth} this month`,
      changeType: 'up' as const,
      icon: Users,
      color: '#3b82f6',
    },
    {
      label: 'Total Collection',
      value: `${stats.payments.totalCollection.toLocaleString()} BDT`,
      change: `${stats.payments.pendingVerification} pending verification`,
      changeType: 'warn' as const,
      icon: Banknote,
      color: '#22c55e',
    },
    {
      label: 'Claims Submitted',
      value: stats.claims.submitted.toString(),
      change: `${stats.claims.approved} approved · ${stats.claims.rejected} rejected`,
      changeType: 'neutral' as const,
      icon: FileText,
      color: '#a855f7',
    },
    {
      label: 'Active Agents',
      value: stats.agents.active.toString(),
      change: `of ${stats.agents.total} total`,
      changeType: 'neutral' as const,
      icon: UserCheck,
      color: '#D32F2F',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white border border-gray-200 rounded-md p-5 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
              {kpi.label}
            </span>
            <div className="p-1.5 rounded-md" style={{ backgroundColor: `${kpi.color}15` }}>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
          </div>
          <p className="text-[#0A2A5E] text-2xl font-bold">{kpi.value}</p>
          <div className="flex items-center gap-1 mt-1.5">
            {kpi.changeType === 'up' && <ArrowUp size={12} className="text-green-600" />}
            {kpi.changeType === 'warn' && <ArrowDown size={12} className="text-amber-600" />}
            {kpi.changeType === 'neutral' && <Minus size={12} className="text-gray-400" />}
            <span
              className={`text-xs font-medium ${
                kpi.changeType === 'up'
                  ? 'text-green-600'
                  : kpi.changeType === 'warn'
                    ? 'text-amber-600'
                    : 'text-gray-500'
              }`}
            >
              {kpi.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
