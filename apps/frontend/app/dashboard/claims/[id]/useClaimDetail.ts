'use client';

import { ClaimDocumentsSchema, ClaimSchema } from '../../../lib/schemas';
import { logger } from '../../../lib/logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

export interface Claim {
  id: string;
  surgeryType: string;
  hospitalName: string;
  admissionDate: string;
  operationDate: string | null;
  doctorName: string | null;
  claimedAmount: number;
  approvedAmount: number | null;
  status: string;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ClaimDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  notes: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface UploadEntry {
  id: string;
  documentType: string;
  file: File | null;
  notes: string;
}

interface LoadDataOptions {
  id: string;
  token: string;
  setClaim: (claim: Claim | null) => void;
  setDocuments: (documents: ClaimDocument[]) => void;
  setError: (error: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export async function loadData({
  id,
  token,
  setClaim,
  setDocuments,
  setError,
  setIsLoading,
}: LoadDataOptions) {
  try {
    const [claimRes, docsRes] = await Promise.all([
      fetch(`${API_BASE}/claims/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/claims/${id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    if (!claimRes.ok || !docsRes.ok) {
      throw new Error('Unable to load claim details');
    }
    setClaim(ClaimSchema.parse(await claimRes.json()));
    setDocuments(ClaimDocumentsSchema.parse(await docsRes.json()));
  } catch (error) {
    setError('Unable to load claim details. Please try again.');
    logger.error('Failed to load claim details', {
      endpoint: `/claims/${id}`,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    setIsLoading(false);
  }
}

interface HandleUploadOptions {
  id: string;
  token: string;
  uploadEntries: UploadEntry[];
  setError: (error: string) => void;
  setIsUploading: (isUploading: boolean) => void;
  setUploadSuccess: (success: boolean) => void;
  setUploadEntries: (entries: UploadEntry[]) => void;
  reload: () => Promise<void>;
}

export async function handleUpload({
  id,
  token,
  uploadEntries,
  setError,
  setIsUploading,
  setUploadSuccess,
  setUploadEntries,
  reload,
}: HandleUploadOptions) {
  const validEntries = uploadEntries.filter((entry) => entry.documentType && entry.file);
  if (validEntries.length === 0) {
    setError('Please select a document type and choose a file for at least one entry');
    return;
  }

  setIsUploading(true);
  setError('');

  try {
    const documents = validEntries.map((entry) => ({
      documentType: entry.documentType,
      fileName: entry.file!.name,
      fileUrl: `/uploads/claims/${id}/${entry.file!.name}`,
      notes: entry.notes || undefined,
    }));

    const response = await fetch(`${API_BASE}/claims/${id}/documents/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    setUploadSuccess(true);
    setUploadEntries([{ id: crypto.randomUUID(), documentType: '', file: null, notes: '' }]);
    await reload();
    setTimeout(() => setUploadSuccess(false), 3000);
  } catch (error: unknown) {
    setError(error instanceof Error ? error.message : String(error));
  } finally {
    setIsUploading(false);
  }
}

export function useClaimDetail(
  options: Omit<LoadDataOptions, 'setIsLoading'> & {
    setIsLoading: (isLoading: boolean) => void;
    uploadEntries: UploadEntry[];
    setIsUploading: (isUploading: boolean) => void;
    setUploadSuccess: (success: boolean) => void;
    setUploadEntries: (entries: UploadEntry[]) => void;
  },
) {
  return {
    loadData: () => loadData(options),
    handleUpload: () =>
      handleUpload({
        ...options,
        reload: () => loadData(options),
      }),
  };
}
