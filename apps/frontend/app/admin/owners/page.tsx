"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import {
  UserCheck,
  Loader2,
  Plus,
  ChevronRight,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface Owner {
  id: string;
  agentCode: string;
  commissionRate: number;
  totalCommissionEarned: number;
  totalMembersRegistered: number;
  activeMembers: number;
  isActive: boolean;
  user?: {
    fullName: string;
    mobileNumber: string;
    memberId: string;
  };
  subAgents?: Owner[];
}

export default function OwnersPage() {
  const { token } = useAuth();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadOwners();
  }, [token]);

  const loadOwners = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents/owners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOwners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `${amount?.toLocaleString() || 0} BDT`;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Owners</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage all owners in the network
          </p>
        </div>
        <Link
          href="/admin/owners/create"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors"
        >
          <Plus size={16} /> Create Owner
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto"
            />
          </div>
        ) : owners.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No owners found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Owner Code
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Mobile
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Commission
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Members
                </th>
                <th className="text-center py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Sub-Agents
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
              {owners.map((owner, i) => (
                <tr
                  key={owner.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                >
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-mono">
                    {owner.agentCode}
                  </td>
                  <td className="py-2.5 px-4 text-gray-800 text-sm font-medium">
                    {owner.user?.fullName}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm">
                    {owner.user?.mobileNumber}
                  </td>
                  <td className="py-2.5 px-4 text-center text-gray-700 text-sm font-semibold">
                    {owner.commissionRate}%
                  </td>
                  <td className="py-2.5 px-4 text-center text-gray-700 text-sm">
                    {owner.totalMembersRegistered || 0}
                  </td>
                  <td className="py-2.5 px-4 text-center text-gray-700 text-sm">
                    {owner.subAgents?.length || 0}
                  </td>
                  <td className="py-2.5 px-4 text-center text-green-600 text-sm font-medium">
                    {formatCurrency(Number(owner.totalCommissionEarned))}
                  </td>
                  <td className="py-2.5 px-4 text-center">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
