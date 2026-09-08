import { z } from 'zod';

export const ClaimSchema = z.object({
  id: z.string(),
  surgeryType: z.string(),
  hospitalName: z.string(),
  admissionDate: z.string(),
  operationDate: z.string().nullable(),
  doctorName: z.string().nullable(),
  claimedAmount: z.number(),
  approvedAmount: z.number().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});

export const ClaimDocumentSchema = z.object({
  id: z.string(),
  documentType: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  notes: z.string().nullable(),
  isVerified: z.boolean(),
  createdAt: z.string(),
});

export const ClaimDocumentsSchema = z.array(ClaimDocumentSchema);

// Claim status update payload
export const ClaimStatusUpdateSchema = z.object({
  status: z.enum([
    'under_review',
    'document_required',
    'hospital_verification',
    'approved',
    'rejected',
    'payment_processed',
  ]),
  approvedAmount: z.number().positive().optional(),
  rejectionReason: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export type ClaimStatusUpdatePayload = z.infer<typeof ClaimStatusUpdateSchema>;

// Claims list response
export const ClaimsListResponseSchema = z.object({
  claims: z.array(ClaimSchema),
  total: z.number(),
  totalPages: z.number(),
});

export type ClaimsListResponse = z.infer<typeof ClaimsListResponseSchema>;
