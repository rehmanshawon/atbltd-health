import { ClaimDocumentsSchema, ClaimSchema } from '../schemas';

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
