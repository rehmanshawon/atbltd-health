"use client";

import { useEffect, useState, Fragment } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  UserCheck,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface Member {
  id: string;
  memberId: string;
  fullName: string;
  mobileNumber: string;
  isActive: boolean;
  createdAt: string;
}

interface AgentData {
  id: string;
  agentCode: string;
  commissionRate: number;
  totalCommissionEarned: number;
  totalMembersRegistered: number;
  isActive: boolean;
  user?: {
    fullName: string;
    mobileNumber: string;
    memberId: string;
    role: string;
  };
  parentAgent?: {
    id: string;
    agentCode: string;
    user?: { fullName: string };
  };
  members?: Member[];
}

export default function AgentsPage() {
  const { token } = useAuth();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (token) loadAgents();
  }, [token]);

  const loadAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  const handleDeactivate = async (agentId: string) => {
    if (!confirm("Request deactivation of this owner?")) return;

    try {
      const res = await fetch(`${API_BASE}/agents/${agentId}/deactivate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      await loadAgents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Agents</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage agents and their members
          </p>
        </div>
        <Link
          href="/admin/agents/create"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors"
        >
          <Plus size={16} /> Create Agent
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            Total Agents
          </p>
          <p className="text-brand-blue text-2xl font-bold mt-1">
            {agents.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            Total Members
          </p>
          <p className="text-brand-blue text-2xl font-bold mt-1">
            {agents.reduce(
              (sum, a) => sum + (a.totalMembersRegistered || 0),
              0,
            )}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase">
            Total Commission Earned
          </p>
          <p className="text-brand-blue text-2xl font-bold mt-1">
            {formatCurrency(
              agents.reduce(
                (sum, a) => sum + Number(a.totalCommissionEarned || 0),
                0,
              ),
            )}
          </p>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <UserCheck size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm font-medium">All Agents</span>
          <span className="text-gray-400 text-xs">({agents.length})</span>
        </div>

        {agents.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No agents found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Agent Code
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Mobile
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Parent Owner
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Commission
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Members
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Earned
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                const isExpanded = expandedIds.has(agent.id);
                const memberCount =
                  agent.members?.length || agent.totalMembersRegistered || 0;

                return (
                  <Fragment key={agent.id}>
                    {/* Agent Row */}
                    <tr
                      className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          {memberCount > 0 && (
                            <button
                              onClick={() => toggleExpand(agent.id)}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown
                                  size={16}
                                  className="text-gray-400"
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className="text-gray-400"
                                />
                              )}
                            </button>
                          )}
                          <span className="text-brand-blue text-sm font-mono">
                            {agent.agentCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-gray-800 text-sm font-medium">
                        {agent.user?.fullName}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 text-sm">
                        {agent.user?.mobileNumber}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600 text-sm">
                        {agent.parentAgent?.agentCode || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center text-gray-700 text-sm font-semibold">
                        {agent.commissionRate}%
                      </td>
                      <td className="py-2.5 px-4 text-center text-gray-700 text-sm">
                        {memberCount}
                      </td>
                      <td className="py-2.5 px-4 text-center text-green-600 text-sm font-medium">
                        {formatCurrency(Number(agent.totalCommissionEarned))}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            agent.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? "bg-green-500" : "bg-gray-400"}`}
                          />
                          {agent.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {agent.isActive ? (
                          <button
                            onClick={() => handleDeactivate(agent.id)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Deactivated
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Members (expanded) */}
                    {isExpanded &&
                      agent.members?.map((member) => (
                        <tr
                          key={member.id}
                          className="bg-gray-50/50 border-b border-gray-50"
                        >
                          <td className="py-2 px-4 pl-12 text-gray-600 text-xs font-mono">
                            {member.memberId}
                          </td>
                          <td className="py-2 px-4 text-gray-600 text-sm">
                            {member.fullName}
                          </td>
                          <td className="py-2 px-4 text-gray-500 text-sm">
                            {member.mobileNumber}
                          </td>
                          <td className="py-2 px-4 text-gray-400 text-sm">—</td>
                          <td className="py-2 px-4 text-center text-gray-400 text-sm">
                            —
                          </td>
                          <td className="py-2 px-4 text-center text-gray-400 text-sm">
                            —
                          </td>
                          <td className="py-2 px-4 text-center text-gray-400 text-sm">
                            —
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                member.isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
