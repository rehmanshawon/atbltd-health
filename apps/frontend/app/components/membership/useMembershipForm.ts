'use client';

import { FormEvent } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.atbltd.health/api';

type EnrollmentStep = 'details' | 'verification' | 'complete';
type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

interface MembershipFormOptions {
  fullName: string;
  phone: string;
  nid: string;
  email: string;
  permanentAddress: string;
  currentAddress: string;
  referralId: string;
  paymentMethod: PaymentMethod;
  senderAccount: string;
  otp: string;
  setStep: (step: EnrollmentStep) => void;
  setOtp: (otp: string) => void;
  setOtpError: (hasError: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setErrorMessage: (message: string) => void;
}

async function readError(response: Response, fallback: string) {
  const data = await response.json();
  return data.message || fallback;
}

export function useMembershipForm(options: MembershipFormOptions) {
  const {
    fullName,
    phone,
    nid,
    email,
    permanentAddress,
    currentAddress,
    referralId,
    paymentMethod,
    senderAccount,
    otp,
    setStep,
    setOtp,
    setOtpError,
    setIsLoading,
    setErrorMessage,
  } = options;

  const sendOtp = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Failed to send OTP'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          mobileNumber: phone,
          nid: nid || undefined,
          email: email || undefined,
          permanentAddress: permanentAddress || undefined,
          currentAddress: currentAddress || undefined,
          referralId: referralId || undefined,
          paymentMethod,
          senderAccount: senderAccount || phone,
        }),
      });
      if (!response.ok) throw new Error(await readError(response, 'Registration failed'));
      setStep('complete');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setOtpError(false);
    setErrorMessage('');
    setIsLoading(true);
    await sendOtp();
    setIsLoading(false);
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setOtpError(false);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phone, otp }),
      });
      if (!response.ok) {
        setOtpError(true);
        throw new Error(await readError(response, 'Invalid OTP'));
      }
      setStep('complete');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { sendOtp, submitRegistration, handleResendOtp, verifyOtp };
}

export type { EnrollmentStep, MembershipFormOptions, PaymentMethod };
