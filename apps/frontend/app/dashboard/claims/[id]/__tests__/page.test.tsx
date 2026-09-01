import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ClaimDetailPage from '../page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'claim-1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('../../../../lib/auth-context', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

jest.mock('../../../../lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const claim = {
  id: 'claim-1',
  surgeryType: 'Cardiac surgery',
  hospitalName: 'ATB Hospital',
  admissionDate: '2026-08-01',
  operationDate: null,
  doctorName: null,
  claimedAmount: 10000,
  approvedAmount: null,
  status: 'document_required',
  rejectionReason: null,
  notes: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

function mockFetchSequence(overrides: { documents?: unknown[]; uploadOk?: boolean } = {}) {
  const { documents = [], uploadOk = true } = overrides;
  return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/documents/upload')) {
      return uploadOk
        ? Promise.resolve({ ok: true, json: async () => ({}) } as Response)
        : Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Upload failed' }),
          } as Response);
    }
    if (url.includes('/documents')) {
      return Promise.resolve({ ok: true, json: async () => documents } as Response);
    }
    return Promise.resolve({ ok: true, json: async () => claim } as Response);
  });
}

describe('ClaimDetailPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders claim details and an empty documents state', async () => {
    global.fetch = mockFetchSequence() as unknown as jest.Mock;

    render(<ClaimDetailPage />);

    await waitFor(() => expect(screen.getByText('Cardiac surgery')).toBeInTheDocument());
    expect(screen.getByText('ATB Hospital')).toBeInTheDocument();
    expect(screen.getByText('No documents uploaded yet')).toBeInTheDocument();
    expect(
      screen.getByText('The review team has requested additional documents'),
    ).toBeInTheDocument();
  });

  it('shows a not-found state when the claim fails to load', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as Response);

    render(<ClaimDetailPage />);

    expect(await screen.findByText('Benefit Application not found')).toBeInTheDocument();
  });

  it('uploads a document and shows a success message', async () => {
    global.fetch = mockFetchSequence() as unknown as jest.Mock;

    render(<ClaimDetailPage />);
    await waitFor(() => expect(screen.getByText('Cardiac surgery')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Discharge Summary' },
    });
    const file = new File(['content'], 'discharge.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/claims/claim-1/documents/upload'),
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(await screen.findByText('Documents uploaded successfully!')).toBeInTheDocument();
  });

  it('shows a validation error when uploading without selecting a file', async () => {
    global.fetch = mockFetchSequence() as unknown as jest.Mock;

    render(<ClaimDetailPage />);
    await waitFor(() => expect(screen.getByText('Cardiac surgery')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(
      await screen.findByText(
        'Please select a document type and choose a file for at least one entry',
      ),
    ).toBeInTheDocument();
  });

  it('shows the server error message when the upload request fails', async () => {
    global.fetch = mockFetchSequence({ uploadOk: false }) as unknown as jest.Mock;

    render(<ClaimDetailPage />);
    await waitFor(() => expect(screen.getByText('Cardiac surgery')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Discharge Summary' },
    });
    const file = new File(['content'], 'discharge.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /upload/i }));

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });
});
