import { act, renderHook } from '@testing-library/react';
import { FormEvent } from 'react';
import { useMembershipForm } from '../useMembershipForm';

function createOptions() {
  return {
    fullName: 'Test Member',
    phone: '01700000000',
    nid: '1234567890',
    email: 'member@example.com',
    permanentAddress: 'Dhaka',
    currentAddress: 'Dhaka',
    referralId: '',
    paymentMethod: 'bkash' as const,
    senderAccount: '01700000000',
    otp: '123456',
    setStep: jest.fn(),
    setOtp: jest.fn(),
    setOtpError: jest.fn(),
    setIsLoading: jest.fn(),
    setErrorMessage: jest.fn(),
  };
}

describe('useMembershipForm', () => {
  afterEach(() => jest.restoreAllMocks());

  it('submits registration and advances on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ memberId: 'ATB-26-ME-1' }),
    } as Response);
    const options = createOptions();
    const { result } = renderHook(() => useMembershipForm(options));
    const event = {
      preventDefault: jest.fn(),
    } as unknown as FormEvent<HTMLFormElement>;

    await act(async () => {
      await result.current.submitRegistration(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(options.setStep).toHaveBeenCalledWith('complete');
    expect(options.setErrorMessage).toHaveBeenCalledWith('');
    expect(options.setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it('marks an invalid OTP and exposes the server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid verification code' }),
    } as Response);
    const options = createOptions();
    const { result } = renderHook(() => useMembershipForm(options));

    await act(async () => {
      await result.current.verifyOtp({
        preventDefault: jest.fn(),
      } as unknown as FormEvent<HTMLFormElement>);
    });

    expect(options.setOtpError).toHaveBeenCalledWith(true);
    expect(options.setErrorMessage).toHaveBeenCalledWith('Invalid verification code');
    expect(options.setStep).not.toHaveBeenCalled();
  });
});
