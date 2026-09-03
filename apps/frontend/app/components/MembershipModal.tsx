'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import PaymentSection from './membership/PaymentSection';
import VerificationStep from './membership/VerificationStep';
import CompleteStep from './membership/CompleteStep';
import { useMembershipForm } from './membership/useMembershipForm';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  strings: {
    title: string;
    details: string;
    payment: string;
    verify: string;
    detailsIntro: string;
    fullName: string;
    mobileNumber: string;
    emailAddress: string;
    optional: string;
    required: string;
    nid: string;
    permanentAddress: string;
    currentAddress: string;
    referralId: string;
    agreementText: string;
    continuePayment: string;
    firstYearMembership: string;
    renewal: string;
    choosePayment: string;
    sendMoney: string;
    sendMoneyDetail: string;
    merchant: string;
    safety: string;
    back: string;
    sentPayment: string;
    verifyMobile: string;
    otpIntro: string;
    yourMobileNumber: string;
    previewNotice: string;
    otp: string;
    enterOtp: string;
    verifyActivate: string;
    membershipPreview: string;
    welcome: string;
    member: string;
    cardNote: string;
    membershipId: string;
    tempPassword: string;
    benefitsAvailable: string;
    done: string;
    previewCode: string;
    transactionId: string;
    paymentMethod: string;
    processingPayment: string;
    sendingOtp: string;
    verifyingOtp: string;
    errorOccurred: string;
    tryAgain: string;
    applicationReceived: string;
    applicationReceivedDesc: string;
    pendingVerificationNote: string;
    whatHappensNext: string;
    benefits: string;
  };
}

type EnrollmentStep = 'details' | 'verification' | 'complete';
type PaymentMethod = 'bkash' | 'nagad' | 'rocket';

export default function MembershipModal({ isOpen, onClose, strings }: MembershipModalProps) {
  const [step, setStep] = useState<EnrollmentStep>('details');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [email, setEmail] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [referralId, setReferralId] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [senderAccount, setSenderAccount] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const close = () => {
    setStep('details');
    setOtp('');
    setOtpError(false);
    setErrorMessage('');
    setIsLoading(false);
    onClose();
  };

  const { submitRegistration, handleResendOtp, verifyOtp } = useMembershipForm({
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
  });

  const currentStep = step === 'details' ? 0 : step === 'verification' ? 1 : 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-title"
            className="membership-modal membership-enrollment glass"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={close} aria-label="Close membership form">
              <X size={20} />
            </button>

            {step !== 'complete' && (
              <>
                <p className="section-eyebrow">ATB Ltd membership</p>
                <h2 id="membership-title">{strings.title}</h2>
                <div className="enrollment-steps" aria-label={`Step ${currentStep + 1} of 3`}>
                  <div className="enrollment-step active">
                    <i>{currentStep > 0 ? <Check size={13} /> : 1}</i>
                    <span>{strings.details}</span>
                  </div>
                  <div className={currentStep >= 1 ? 'enrollment-step active' : 'enrollment-step'}>
                    <i>{currentStep > 1 ? <Check size={13} /> : 2}</i>
                    <span>{strings.verify}</span>
                  </div>
                  <div className={currentStep >= 2 ? 'enrollment-step active' : 'enrollment-step'}>
                    <i>3</i>
                    <span>{strings.done}</span>
                  </div>
                </div>
              </>
            )}

            {errorMessage && step !== 'complete' && (
              <div
                className="prototype-notice"
                style={{ marginTop: '1rem', borderLeftColor: '#ff7777' }}
              >
                <p style={{ margin: 0 }}>{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff9999',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {strings.tryAgain || 'Dismiss'}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Details + Payment */}
              {step === 'details' && (
                <motion.form
                  key="details"
                  onSubmit={submitRegistration}
                  className="enrollment-form"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <p className="modal-intro">{strings.detailsIntro}</p>

                  <div className="form-two-column">
                    <label>
                      {strings.fullName}
                      <input
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={strings.fullName}
                        disabled={isLoading}
                      />
                    </label>
                    <label>
                      {strings.mobileNumber}
                      <input
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  <label>
                    {strings.emailAddress} <span>{strings.optional}</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={isLoading}
                    />
                  </label>

                  <label>
                    {strings.nid}
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                      placeholder={strings.nid}
                      disabled={isLoading}
                    />
                  </label>

                  <label>
                    {strings.permanentAddress}
                    <textarea
                      required
                      rows={2}
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder={strings.permanentAddress}
                      disabled={isLoading}
                    />
                  </label>

                  <label>
                    {strings.currentAddress}
                    <textarea
                      required
                      rows={2}
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder={strings.currentAddress}
                      disabled={isLoading}
                    />
                  </label>

                  <label>
                    {strings.referralId} <span>{strings.optional}</span>
                    <input
                      autoComplete="off"
                      value={referralId}
                      onChange={(e) => setReferralId(e.target.value)}
                      placeholder={strings.referralId}
                      disabled={isLoading}
                    />
                  </label>

                  <PaymentSection
                    strings={strings}
                    paymentMethod={paymentMethod}
                    senderAccount={senderAccount}
                    isLoading={isLoading}
                    onPaymentMethodChange={(method) => setPaymentMethod(method as PaymentMethod)}
                    onSenderAccountChange={setSenderAccount}
                  />

                  <label className="agreement-field">
                    <input
                      type="checkbox"
                      required
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>{strings.agreementText}</span>
                  </label>

                  <button
                    className="primary-button modal-submit"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {strings.processingPayment || 'Processing...'}
                      </>
                    ) : (
                      strings.continuePayment
                    )}
                  </button>
                </motion.form>
              )}

              {/* Step 2: Verification */}
              {step === 'verification' && (
                <VerificationStep
                  strings={strings}
                  phone={phone}
                  otp={otp}
                  otpError={otpError}
                  isLoading={isLoading}
                  onOtpChange={(value) => {
                    setOtp(value);
                    setOtpError(false);
                  }}
                  onBack={() => setStep('details')}
                  onResendOtp={handleResendOtp}
                  onSubmit={verifyOtp}
                />
              )}

              {/* Step 3: Complete */}
              {step === 'complete' && <CompleteStep strings={strings} onClose={close} />}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
