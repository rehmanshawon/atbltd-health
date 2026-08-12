"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { usersApi } from "../../lib/api";
import {
  Users,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Member {
  id: string;
  memberId: string;
  fullName: string;
  mobileNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function MembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) loadMembers();
  }, [token, page]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      if (search) {
        const data = await usersApi.search(token!, search);
        setMembers(data || []);
        setTotal((data || []).length);
        setTotalPages(1);
      } else {
        const data = await usersApi.findAll(token!, page, "member");
        setMembers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMembers();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brand-blue">Members</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage all registered members
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-gray-700 text-sm font-medium">
              All Members
            </span>
            <span className="text-gray-400 text-xs">({total})</span>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, or ID..."
              className="w-64 pl-9 pr-3 py-1.5 rounded border border-gray-200 text-gray-700 text-xs placeholder-gray-400 focus:outline-none focus:border-brand-red"
            />
          </form>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2
              size={28}
              className="animate-spin text-brand-red mx-auto"
            />
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No members found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Member ID
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Mobile
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                >
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-mono">
                    {m.memberId}
                  </td>
                  <td className="py-2.5 px-4 text-gray-800 text-sm font-medium">
                    {m.fullName}
                  </td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm">
                    {m.mobileNumber}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        m.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      {m.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs">
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-gray-500 text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
