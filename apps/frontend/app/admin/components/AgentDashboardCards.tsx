'use client';

import { Users, Banknote, UserCheck } from 'lucide-react';

interface AgentStats {
  members: { total: number; active: number };
  commissions?: { totalEarned: number; totalPaid: number };
  agents: { total: number };
}

export default function AgentDashboardCards({ stats }: { stats: AgentStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            My Members
          </span>
          <Users size={16} className="text-blue-600" />
        </div>
        <p className="text-[#0A2A5E] text-2xl font-bold">{stats.members.total}</p>
        <p className="text-gray-500 text-xs mt-1">{stats.members.active} active</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Commission Earned
          </span>
          <Banknote size={16} className="text-green-600" />
        </div>
        <p className="text-[#0A2A5E] text-2xl font-bold">
          {(stats.commissions?.totalEarned || 0).toLocaleString()} BDT
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {(stats.commissions?.totalPaid || 0).toLocaleString()} BDT paid
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Sub-Agents
          </span>
          <UserCheck size={16} className="text-purple-600" />
        </div>
        <p className="text-[#0A2A5E] text-2xl font-bold">{stats.agents.total}</p>
      </div>
    </div>
  );
}
