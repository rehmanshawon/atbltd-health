import { handleUpload, loadData, UploadEntry } from '../useClaimDetail';

const claim = {
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
};

describe('useClaimDetail helpers', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads and validates claim and document responses', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => claim } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);
    const setClaim = jest.fn();
    const setDocuments = jest.fn();
    const setError = jest.fn();
    const setIsLoading = jest.fn();

    await loadData({
      id: 'claim-1',
      token: 'token',
      setClaim,
      setDocuments,
      setError,
      setIsLoading,
    });

    expect(setClaim).toHaveBeenCalledWith(claim);
    expect(setDocuments).toHaveBeenCalledWith([]);
    expect(setError).not.toHaveBeenCalled();
    expect(setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it('uploads valid entries and reloads the claim', async () => {
    const file = new File(['content'], 'discharge.pdf', { type: 'application/pdf' });
    const uploadEntries: UploadEntry[] = [
      { id: 'entry-1', documentType: 'Discharge Summary', file, notes: 'Final copy' },
    ];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    const reload = jest.fn().mockResolvedValue(undefined);
    const setUploadSuccess = jest.fn();
    const setUploadEntries = jest.fn();

    await handleUpload({
      id: 'claim-1',
      token: 'token',
      uploadEntries,
      setError: jest.fn(),
      setIsUploading: jest.fn(),
      setUploadSuccess,
      setUploadEntries,
      reload,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/claims/claim-1/documents/upload'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(setUploadSuccess).toHaveBeenCalledWith(true);
    expect(setUploadEntries).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });
});
