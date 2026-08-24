"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BanknoteArrowUp,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  X,
  Loader2,
  Clock,
  Gift,
  Text,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

// --- API base URL ---
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

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
    // New strings for API integration
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

type EnrollmentStep = "details" | "payment" | "verification" | "complete";
type PaymentMethod = "bkash" | "nagad" | "rocket";

const gateways: PaymentMethod[] = ["bkash", "Nagad" as any, "Rocket" as any];

export default function MembershipModal({
  isOpen,
  onClose,
  strings,
}: MembershipModalProps) {
  const [step, setStep] = useState<EnrollmentStep>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [email, setEmail] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [referralId, setReferralId] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");
  //const [transactionId, setTransactionId] = useState("");
  const [senderAccount, setSenderAccount] = useState("");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [memberId, setMemberId] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const close = () => {
    setStep("details");
    setOtp("");
    setOtpError(false);
    setErrorMessage("");
    setIsLoading(false);
    onClose();
  };

  /**
   * Step 1 → Step 2: Submit details and payment info to the backend
   * POST /api/auth/register
   */
  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobileNumber: phone,
          nid: nid || undefined,
          email: email || undefined,
          permanentAddress: permanentAddress || undefined,
          currentAddress: currentAddress || undefined,
          referralId: referralId || undefined,
          paymentMethod,
          //transactionId,
          senderAccount: senderAccount || phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Store the member ID and temp password from the response
      setMemberId(data.memberId || "");
      setTempPassword(data.temporaryPassword || "");

      // Go directly to complete — no OTP step
      setStep("complete");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send OTP to the registered mobile number
   * POST /api/auth/send-otp
   */
  const sendOtp = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to send OTP";
      setErrorMessage(msg);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    setOtp("");
    setOtpError(false);
    setErrorMessage("");
    setIsLoading(true);
    await sendOtp();
    setIsLoading(false);
  };

  /**
   * Step 3 → Complete: Verify OTP
   * POST /api/auth/verify-otp
   */
  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setOtpError(false);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(true);
        throw new Error(data.message || "Invalid OTP");
      }

      // OTP verified — show completion screen
      setStep("complete");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Verification failed";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyValue = (value: string) => navigator.clipboard?.writeText(value);

  const currentStep =
    step === "details"
      ? 0
      : step === "payment"
        ? 0
        : step === "verification"
          ? 1
          : 2;

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
            <button
              className="modal-close"
              onClick={close}
              aria-label="Close membership form"
            >
              <X size={20} />
            </button>

            {step !== "complete" && (
              <>
                <p className="section-eyebrow">ATB Ltd membership</p>
                <h2 id="membership-title">{strings.title}</h2>
                <div
                  className="enrollment-steps"
                  aria-label={`Step ${currentStep + 1} of 3`}
                >
                  <div
                    className={
                      currentStep >= 0
                        ? "enrollment-step active"
                        : "enrollment-step"
                    }
                  >
                    <i>{currentStep > 0 ? <Check size={13} /> : 1}</i>
                    <span>{strings.details}</span>
                  </div>
                  <div
                    className={
                      currentStep >= 1
                        ? "enrollment-step active"
                        : "enrollment-step"
                    }
                  >
                    <i>{currentStep > 1 ? <Check size={13} /> : 2}</i>
                    <span>{strings.verify}</span>
                  </div>
                  <div
                    className={
                      currentStep >= 2
                        ? "enrollment-step active"
                        : "enrollment-step"
                    }
                  >
                    <i>3</i>
                    <span>{strings.done}</span>
                  </div>
                </div>
              </>
            )}

            {/* Error banner */}
            {errorMessage && step !== "complete" && (
              <div
                className="prototype-notice"
                style={{ marginTop: "1rem", borderLeftColor: "#ff7777" }}
              >
                <p style={{ margin: 0 }}>{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff9999",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {strings.tryAgain || "Dismiss"}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ========== STEP 1: DETAILS + PAYMENT ========== */}
              {step === "details" && (
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
                        onChange={(event) => setFullName(event.target.value)}
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
                        onChange={(event) => setPhone(event.target.value)}
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

                  {/* Payment section inline */}
                  <div
                    className="payment-summary"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <span>{strings.firstYearMembership}</span>
                    <strong>1,000 BDT</strong>
                    <small>{strings.renewal}</small>
                  </div>

                  <p className="modal-intro" style={{ marginTop: "0.5rem" }}>
                    {strings.choosePayment}
                  </p>

                  <div className="gateway-list">
                    <button
                      className={`send-money-card ${paymentMethod === "bkash" ? "" : ""}`}
                      type="button"
                      onClick={() => setPaymentMethod("bkash")}
                      style={{
                        borderColor:
                          paymentMethod === "bkash" ? "#ff8a8a" : undefined,
                        opacity: 1,
                      }}
                      disabled={isLoading}
                    >
                      <span className="gateway-symbol">
                        <BanknoteArrowUp size={20} />
                      </span>
                      <span>
                        <strong>{strings.sendMoney}</strong>
                        <small>Send 1,000 BDT to:</small>
                        <span
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: "bold",
                            color: "#ff8a8a",
                            display: "block",
                            marginTop: "4px",
                          }}
                        >
                          01721719611
                        </span>
                        <small style={{ marginTop: "4px", display: "block" }}>
                          ATB Official bKash (Personal)
                        </small>
                      </span>
                      {/* {paymentMethod === "bkash" ? (
                        <BadgeCheck size={20} color="#ff8a8a" />
                      ) : (
                        <div style={{ width: 20 }} />
                      )} */}
                      <BadgeCheck size={20} />
                    </button>
                  </div>

                  {/* <label>
                    {strings.transactionId || "Transaction ID"}
                    <input
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g., TXN123456"
                      disabled={isLoading}
                    />
                  </label> */}

                  <label>
                    {strings.paymentMethod ||
                      "Sender Account (your bKash number)"}
                    <span>{strings.required}</span>
                    <input
                      required
                      inputMode="tel"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      disabled={isLoading}
                    />
                  </label>

                  <div className="payment-assistance">
                    <ShieldCheck size={17} />
                    <span>{strings.safety}</span>
                  </div>

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
                        {strings.processingPayment || "Processing..."}
                      </>
                    ) : (
                      strings.continuePayment
                    )}
                  </button>
                </motion.form>
              )}

              {/* ========== STEP 2: OTP VERIFICATION ========== */}
              {step === "verification" && (
                <motion.form
                  key="verification"
                  onSubmit={verifyOtp}
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
                    {strings.otpIntro}{" "}
                    <strong>{phone || strings.yourMobileNumber}</strong>.
                  </p>

                  <p className="prototype-notice">
                    {strings.previewNotice ||
                      "A 6-digit code has been sent to your mobile number. In development mode, use 123456."}
                  </p>

                  <label>
                    {strings.otp}
                    <input
                      className={otpError ? "otp-input otp-error" : "otp-input"}
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value.replace(/\D/g, ""));
                        setOtpError(false);
                      }}
                      placeholder="••••••"
                      disabled={isLoading}
                    />
                  </label>

                  {otpError && (
                    <p className="otp-error-text">{strings.enterOtp}</p>
                  )}

                  <div className="form-actions">
                    <button
                      className="modal-back-button"
                      onClick={() => setStep("details")}
                      type="button"
                      disabled={isLoading}
                    >
                      <ChevronLeft size={18} />
                      {strings.back}
                    </button>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        style={{ padding: "0.9rem 1rem", fontSize: "0.8rem" }}
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Resend OTP"
                        )}
                      </button>
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {strings.verifyingOtp || "Verifying..."}
                          </>
                        ) : (
                          strings.verifyActivate
                        )}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              {/* ========== COMPLETE ========== */}
              {step === "complete" && (
                <motion.div
                  key="complete"
                  className="membership-complete"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle2 size={52} />
                  <p className="section-eyebrow">{strings.membershipPreview}</p>
                  <h2>
                    {strings.applicationReceived || "Application Received!"}
                  </h2>
                  <p>{strings.applicationReceivedDesc}</p>

                  <div className="activation-note">
                    <Gift size={18} />
                    {strings.pendingVerificationNote ||
                      "Payment verification in progress."}
                  </div>

                  <div
                    className="activation-note"
                    style={{ background: "rgba(37, 99, 235, 0.12)" }}
                  >
                    <Text size={18} />
                    {strings.whatHappensNext ||
                      "SMS with login credentials will be sent after verification."}
                  </div>
                  <div
                    className="activation-note"
                    style={{ background: "rgba(37, 99, 235, 0.12)" }}
                  >
                    <CreditCard size={18} />
                    {strings.benefits ||
                      "SMS with login credentials will be sent after verification."}
                  </div>

                  <button
                    className="secondary-button modal-submit"
                    onClick={close}
                  >
                    {strings.done}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
