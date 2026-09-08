'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { logger } from '../../lib/logger';
import { ClaimStatusUpdateSchema, ClaimsListResponseSchema } from '../../lib/schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

export interface AdminClaim {
  id: string;
  memberId?: string;
  surgeryType: string;
  hospitalName: string;
  admissionDate: string;
  operationDate?: string | null;
  doctorName?: string | null;
  claimedAmount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  documents?: string[] | null;
  createdAt: string;
  member?: { memberId: string; fullName: string; mobileNumber: string };
}

interface UpdateStatusOptions {
  approvedAmount?: string;
  rejectionReason?: string;
  notes?: string;
}

export function useAdminClaims() {
  const { token } = useAuth();
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = useCallback(
    async (page = 1, statusFilter = '') => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        params.set('page', String(page));
        params.set('limit', '15');

        const res = await fetch(`${API_BASE}/claims?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error(`Failed to load claims: HTTP ${res.status}`);
        }

        const rawData = await res.json();
        const parsed = ClaimsListResponseSchema.safeParse(rawData);

        if (!parsed.success) {
          logger.error('Invalid claims list response from API', {
            endpoint: '/claims',
            error: parsed.error.message,
          });
          setClaims([]);
          setTotal(0);
          setTotalPages(1);
          return;
        }

        setClaims(parsed.data.claims);
        setTotal(parsed.data.total);
        setTotalPages(parsed.data.totalPages);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Failed to load admin claims', {
          endpoint: '/claims',
          error: message,
        });
        setError(message);
        setClaims([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  const updateClaimStatus = useCallback(
    async (claimId: string, status: string, options?: UpdateStatusOptions) => {
      const payload: Record<string, unknown> = { status };

      if (status === 'approved' && options?.approvedAmount) {
        payload.approvedAmount = parseFloat(options.approvedAmount);
      }
      if (status === 'rejected' && options?.rejectionReason) {
        payload.rejectionReason = options.rejectionReason;
      }
      if (options?.notes) {
        payload.notes = options.notes;
      }

      const validationResult = ClaimStatusUpdateSchema.safeParse(payload);

      if (!validationResult.success) {
        const message = `Invalid status update payload: ${validationResult.error.message}`;
        logger.error(message, {
          endpoint: `/claims/${claimId}/status`,
          payload,
        });
        throw new Error(message);
      }

      const res = await fetch(`${API_BASE}/claims/${claimId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validationResult.data),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Update failed');
      }

      return res.json();
    },
    [token],
  );

  return {
    claims,
    setClaims,
    total,
    totalPages,
    isLoading,
    error,
    loadClaims,
    updateClaimStatus,
  };
}
