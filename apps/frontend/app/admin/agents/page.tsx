"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  UserCheck,
  Loader2,
  ChevronRight,
  ChevronDown,
  Plus,
  Users,
  TrendingUp,
  Circle,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface AgentData {
  id: string;
  agentCode: string;
  commissionRate: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  totalMembersRegistered: number;
  activeMembers: number;
  isActive: boolean;
  createdAt: string;
  user?: {
    id: string;
    memberId: string;
    fullName: string;
    mobileNumber: string;
    role: string;
    isActive: boolean;
  };
  parentAgent?: {
    id: string;
    agentCode: string;
    user?: { fullName: string };
  };
  subAgents?: AgentData[];
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
      setAgents(data || []);
    } catch (err) {
      console.error(err);
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

  // Build hierarchy: owners at top level, agents under their parent
  const owners = agents.filter(
    (a) => !a.parentAgent && a.user?.role === "owner",
  );
  const agentsWithoutParent = agents.filter(
    (a) => !a.parentAgent && a.user?.role === "agent",
  );

  const getSubAgents = (parentId: string) => {
    return agents.filter((a) => a.parentAgent?.id === parentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Agent Network</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage owners, agents, and view hierarchy
          </p>
        </div>
        <Link
          href="/admin/agents/create"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors"
        >
          <Plus size={16} /> Create Owner / Agent
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
            Total Members Registered
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

      {/* Agent Hierarchy Tree */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <UserCheck size={16} className="text-gray-400" />
          <span className="text-gray-700 text-sm font-medium">
            Agent Hierarchy
          </span>
          <span className="text-gray-400 text-xs">({agents.length})</span>
        </div>

        {agents.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No agents found
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Owners (top level) */}
            {owners.map((owner) => {
              const subAgents = getSubAgents(owner.id);
              const isExpanded = expandedIds.has(owner.id);
              return (
                <div key={owner.id}>
                  {/* Owner Row */}
                  <div className="flex items-center px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <button
                      onClick={() => toggleExpand(owner.id)}
                      className="p-1 rounded hover:bg-gray-100 mr-2"
                    >
                      {subAgents.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )
                      ) : (
                        <Circle size={6} className="text-gray-300 mx-1.5" />
                      )}
                    </button>

                    <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            OWNER
                          </span>
                          <span className="text-brand-blue text-sm font-mono font-medium">
                            {owner.agentCode}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm font-medium mt-0.5">
                          {owner.user?.fullName}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {owner.user?.mobileNumber}
                        </p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-gray-400 text-[10px] uppercase">
                          Commission
                        </p>
                        <p className="text-gray-700 text-sm font-semibold">
                          {owner.commissionRate}%
                        </p>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users size={13} className="text-gray-400" />
                          <span className="text-gray-700 text-sm font-medium">
                            {owner.totalMembersRegistered || 0}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[10px]">members</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp size={13} className="text-green-500" />
                          <span className="text-gray-700 text-sm font-medium">
                            {formatCurrency(
                              Number(owner.totalCommissionEarned),
                            )}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[10px]">earned</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            owner.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${owner.isActive ? "bg-green-500" : "bg-gray-400"}`}
                          />
                          {owner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-gray-400 text-xs">
                          {subAgents.length} agent
                          {subAgents.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-agents (expanded) */}
                  {isExpanded &&
                    subAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center px-5 py-2.5 bg-gray-50/30 border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="w-8 mr-2 flex justify-center">
                          <div className="w-0.5 h-6 bg-gray-200" />
                        </div>
                        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3 pl-4">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                AGENT
                              </span>
                              <span className="text-brand-blue text-sm font-mono">
                                {agent.agentCode}
                              </span>
                            </div>
                            <p className="text-gray-800 text-sm font-medium mt-0.5">
                              {agent.user?.fullName}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {agent.user?.mobileNumber}
                            </p>
                          </div>
                          <div className="col-span-2 text-center">
                            <p className="text-gray-700 text-sm font-semibold">
                              {agent.commissionRate}%
                            </p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-gray-700 text-sm font-medium">
                              {agent.totalMembersRegistered || 0}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-gray-700 text-sm font-medium">
                              {formatCurrency(
                                Number(agent.totalCommissionEarned),
                              )}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
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
                          </div>
                          <div className="col-span-1" />
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}

            {/* Standalone agents (no parent) */}
            {agentsWithoutParent.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center px-5 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-8 mr-2" />
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        AGENT
                      </span>
                      <span className="text-brand-blue text-sm font-mono">
                        {agent.agentCode}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm font-medium mt-0.5">
                      {agent.user?.fullName}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {agent.user?.mobileNumber}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="text-gray-700 text-sm font-semibold">
                      {agent.commissionRate}%
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-gray-700 text-sm font-medium">
                      {agent.totalMembersRegistered || 0}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-gray-700 text-sm font-medium">
                      {formatCurrency(Number(agent.totalCommissionEarned))}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
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
                  </div>
                  <div className="col-span-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
