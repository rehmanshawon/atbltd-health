'use client';

import { Clock, CheckCircle2, Search } from 'lucide-react';
import AdminTable from './AdminTable';

interface PendingPayment {
  id: string;
  amount: number;
  method: string;
  senderAccount: string;
  status: string;
  createdAt: string;
  user?: { memberId: string; fullName: string; mobileNumber: string };
}

interface PendingPaymentsTableProps {
  payments: PendingPayment[];
  onAuthorize: (id: string) => void;
}

export default function PendingPaymentsTable({ payments, onAuthorize }: PendingPaymentsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="flex flex-col gap-3 px-6 py-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-amber-600" />
          <h3 className="text-[#0A2A5E] font-semibold text-sm">Pending Authorizations</h3>
          {payments.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              {payments.length}
            </span>
          )}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full sm:w-48 pl-9 pr-3 py-1.5 rounded-md border border-gray-200 text-gray-700 text-xs placeholder-gray-400 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-colors"
          />
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={22} className="text-green-600" />
          </div>
          <p className="text-gray-600 text-sm font-medium">All caught up</p>
          <p className="text-gray-400 text-xs mt-1">No pending payments to authorize</p>
        </div>
      ) : (
        <AdminTable minWidth={920}>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Member
              </th>
              <th className="text-left py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Method
              </th>
              <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Date
              </th>
              <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Sender Account
              </th>
              <th className="text-right py-3 px-6 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                <td className="py-3.5 px-6">
                  <p className="text-[#0A2A5E] text-sm font-medium">
                    {p.user?.fullName || 'Unknown'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{p.user?.memberId}</p>
                </td>
                <td className="py-3.5 px-6">
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs capitalize">
                    {p.method}
                  </span>
                </td>
                <td className="py-3.5 px-6 text-right text-[#0A2A5E] text-sm font-semibold">
                  {p.amount.toLocaleString()} BDT
                </td>
                <td className="py-3.5 px-6 text-right text-gray-500 text-xs">
                  {new Date(p.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3.5 px-6 text-right text-gray-400 text-xs font-mono">
                  {p.senderAccount || '—'}
                </td>
                <td className="py-3.5 px-6 text-right">
                  <button
                    onClick={() => onAuthorize(p.id)}
                    className="px-3 py-1.5 rounded-md bg-[#D32F2F] text-white text-xs font-medium hover:bg-[#b71c1c] transition-colors"
                  >
                    Authorize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
