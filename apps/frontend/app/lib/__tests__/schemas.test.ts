import {
  ClaimDocumentsSchema,
  ClaimSchema,
  ClaimStatusUpdateSchema,
  ClaimsListResponseSchema,
} from '../schemas';

describe('API schemas', () => {
  it('accepts a complete claim payload', () => {
    expect(
      ClaimSchema.parse({
        id: 'claim-1',
        surgeryType: 'Cardiac surgery',
        hospitalName: 'ATB Hospital',
        admissionDate: '2026-08-01',
        operationDate: null,
        doctorName: null,
        claimedAmount: 10000,
        approvedAmount: null,
        status: 'submitted',
        rejectionReason: null,
        notes: null,
        createdAt: '2026-08-01T00:00:00.000Z',
      }).id,
    ).toBe('claim-1');
  });

  it('rejects malformed claim and document payloads', () => {
    expect(() => ClaimSchema.parse({ id: 'claim-1' })).toThrow();
    expect(() => ClaimDocumentsSchema.parse([{ id: 'doc-1' }])).toThrow();
  });
});
// In schemas.test.ts, add:

describe('ClaimStatusUpdateSchema', () => {
  it('accepts valid status', () => {
    const result = ClaimStatusUpdateSchema.safeParse({ status: 'approved', approvedAmount: 5000 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = ClaimStatusUpdateSchema.safeParse({ status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts rejection with reason', () => {
    const result = ClaimStatusUpdateSchema.safeParse({
      status: 'rejected',
      rejectionReason: 'Documents missing',
    });
    expect(result.success).toBe(true);
  });
});

describe('ClaimsListResponseSchema', () => {
  it('accepts valid claims list', () => {
    const result = ClaimsListResponseSchema.safeParse({
      claims: [],
      total: 0,
      totalPages: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = ClaimsListResponseSchema.safeParse({ claims: [] });
    expect(result.success).toBe(false);
  });
});
