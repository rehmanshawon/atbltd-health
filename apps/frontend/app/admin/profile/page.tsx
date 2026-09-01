'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { CheckCircle2, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

export default function ProfilePage() {
  const { token, user } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mobileNumber, email: email || undefined, fullName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');

      setSuccess('Profile updated successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-blue">Profile Settings</h1>

      {success && (
        <div className="p-3.5 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-md p-6 space-y-4"
      >
        <div>
          <label className="block text-gray-600 text-xs font-semibold mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-xs font-semibold mb-1.5">
            Mobile Number *
          </label>
          <input
            required
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-xs font-semibold mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-gray-300 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-md bg-brand-red text-white text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
