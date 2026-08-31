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
