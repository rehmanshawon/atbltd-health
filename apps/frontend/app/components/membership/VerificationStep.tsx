'use client';

import { ChevronLeft, Loader2, Smartphone } from 'lucide-react';

interface VerificationStepProps {
  strings: {
    verifyMobile: string;
    otpIntro: string;
    yourMobileNumber: string;
    previewNotice: string;
    otp: string;
    enterOtp: string;
    verifyActivate: string;
    verifyingOtp: string;
    back: string;
  };
  phone: string;
  otp: string;
  otpError: boolean;
  isLoading: boolean;
  onOtpChange: (value: string) => void;
  onBack: () => void;
  onResendOtp: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function VerificationStep({
  strings,
  phone,
  otp,
  otpError,
  isLoading,
  onOtpChange,
  onBack,
  onResendOtp,
  onSubmit,
}: VerificationStepProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="enrollment-form enrollment-screen"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
    >
      <div className="verification-orb">
        <Smartphone size={27} />
      </div>

      <h3>{strings.verifyMobile}</h3>

      <p className="modal-intro">
        {strings.otpIntro} <strong>{phone || strings.yourMobileNumber}</strong>.
      </p>

      <p className="prototype-notice">{strings.previewNotice}</p>

      <label>
        {strings.otp}
        <input
          className={otpError ? 'otp-input otp-error' : 'otp-input'}
          required
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          disabled={isLoading}
        />
      </label>

      {otpError && <p className="otp-error-text">{strings.enterOtp}</p>}

      <div className="form-actions">
        <button className="modal-back-button" onClick={onBack} type="button" disabled={isLoading}>
          <ChevronLeft size={18} />
          {strings.back}
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onResendOtp}
            disabled={isLoading}
            style={{ padding: '0.9rem 1rem', fontSize: '0.8rem' }}
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Resend OTP'}
          </button>
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {strings.verifyingOtp}
              </>
            ) : (
              strings.verifyActivate
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
