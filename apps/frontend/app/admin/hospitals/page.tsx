'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Building2, Plus, Loader2 } from 'lucide-react';
import AdminTable from '../components/AdminTable';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

interface Hospital {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  loginId: string;
  isPartner: boolean;
  isActive: boolean;
}

export default function HospitalsPage() {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    contactPerson: '',
    loginId: '',
    password: '',
    isPartner: true,
  });
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (token) loadHospitals();
  }, [token]);

  const loadHospitals = async () => {
    try {
      const res = await fetch(`${API_BASE}/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHospitals(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/hospitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      setMsg('Hospital created successfully');
      setShowCreate(false);
      setForm({
        name: '',
        address: '',
        contactNumber: '',
        email: '',
        contactPerson: '',
        loginId: '',
        password: '',
        isPartner: true,
      });
      loadHospitals();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-blue">Hospitals</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Partner hospitals with claim verification access
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90"
        >
          <Plus size={16} /> Add Hospital
        </button>
      </div>

      {msg && <div className="p-3 rounded bg-gray-50 border text-sm">{msg}</div>}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-md p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Hospital Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            required
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            required
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            placeholder="Contact Person"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            required
            placeholder="Login ID"
            value={form.loginId}
            onChange={(e) => setForm({ ...form, loginId: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <input
            required
            placeholder="Password"
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 rounded border border-gray-200 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 rounded bg-brand-blue text-white text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Hospital'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin text-brand-red mx-auto" />
          </div>
        ) : (
          <AdminTable minWidth={720}>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Name
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Login ID
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Contact
                </th>
                <th className="text-left py-2.5 px-4 text-gray-500 text-xs font-semibold uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, i) => (
                <tr
                  key={h.id}
                  className={`border-b border-gray-50 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                  }`}
                >
                  <td className="py-2.5 px-4 text-brand-blue text-sm font-medium">{h.name}</td>
                  <td className="py-2.5 px-4 text-gray-500 text-xs font-mono">{h.loginId}</td>
                  <td className="py-2.5 px-4 text-gray-600 text-sm">{h.contactNumber}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        h.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {h.isActive ? 'Active' : 'Inactive'}
                    </span>
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
