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
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

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
  };
}

type EnrollmentStep = "details" | "payment" | "verification" | "complete";

const gateways = ["bKash", "Nagad", "Rocket"];

export default function MembershipModal({
  isOpen,
  onClose,
  strings,
}: MembershipModalProps) {
  const [step, setStep] = useState<EnrollmentStep>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [membershipId, setMembershipId] = useState("");

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
    onClose();
  };

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMembershipId(
      `ATB-${new Date().getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000),
      )}`,
    );
    setStep("payment");
  };

  const previewOtpMap: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };

  const previewOtp = strings.previewCode.replace(
    /[০-৯]/g,
    (value) => previewOtpMap[value] ?? value,
  );

  const verifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp === "123456" || otp === previewOtp) {
      setStep("complete");
    } else {
      setOtpError(true);
    }
  };

  const copyValue = (value: string) => navigator.clipboard?.writeText(value);
  const currentStep = step === "details" ? 0 : step === "payment" ? 1 : 2;

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
                <p className="section-eyebrow">ATB membership</p>
                <h2 id="membership-title">{strings.title}</h2>
                <div
                  className="enrollment-steps"
                  aria-label={`Step ${currentStep + 1} of 3`}
                >
                  {[strings.details, strings.payment, strings.verify].map(
                    (label, index) => (
                      <div
                        key={label}
                        className={
                          index <= currentStep
                            ? "enrollment-step active"
                            : "enrollment-step"
                        }
                      >
                        <i>
                          {index < currentStep ? (
                            <Check size={13} />
                          ) : (
                            index + 1
                          )}
                        </i>
                        <span>{label}</span>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}

            <AnimatePresence mode="wait">
              {step === "details" && (
                <motion.form
                  key="details"
                  onSubmit={submitDetails}
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
                      />
                    </label>
                  </div>

                  <label>
                    {strings.emailAddress} <span>{strings.optional}</span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </label>

                  <label>
                    {strings.nid}
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={strings.nid}
                    />
                  </label>

                  <label>
                    {strings.permanentAddress}
                    <textarea
                      required
                      rows={2}
                      placeholder={strings.permanentAddress}
                    />
                  </label>

                  <label>
                    {strings.currentAddress}
                    <textarea
                      required
                      rows={2}
                      placeholder={strings.currentAddress}
                    />
                  </label>

                  <label>
                    {strings.referralId} <span>{strings.optional}</span>
                    <input
                      autoComplete="off"
                      placeholder={strings.referralId}
                    />
                  </label>

                  <label className="agreement-field">
                    <input type="checkbox" required />
                    <span>{strings.agreementText}</span>
                  </label>

                  <button className="primary-button modal-submit" type="submit">
                    {strings.continuePayment}
                  </button>
                </motion.form>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  className="enrollment-screen"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                >
                  <div className="payment-summary">
                    <span>{strings.firstYearMembership}</span>
                    <strong>1,000 BDT</strong>
                    <small>{strings.renewal}</small>
                  </div>

                  <p className="modal-intro">{strings.choosePayment}</p>

                  <div className="gateway-list">
                    <button className="send-money-card" type="button">
                      <span className="gateway-symbol">
                        <BanknoteArrowUp size={20} />
                      </span>
                      <span>
                        <strong>{strings.sendMoney}</strong>
                        <small>{strings.sendMoneyDetail}</small>
                      </span>
                      <BadgeCheck size={20} />
                    </button>

                    {gateways.map((gateway) => (
                      <button
                        key={gateway}
                        className="gateway-card"
                        type="button"
                        disabled
                      >
                        <span className="gateway-symbol">
                          <Smartphone size={19} />
                        </span>
                        <span>
                          <strong>{gateway}</strong>
                          <small>{strings.merchant}</small>
                        </span>
                        <LockKeyhole size={17} />
                      </button>
                    ))}
                  </div>

                  <div className="payment-assistance">
                    <ShieldCheck size={17} />
                    <span>{strings.safety}</span>
                  </div>

                  <div className="form-actions">
                    <button
                      className="modal-back-button"
                      onClick={() => setStep("details")}
                      type="button"
                    >
                      <ChevronLeft size={18} />
                      {strings.back}
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => setStep("verification")}
                      type="button"
                    >
                      {strings.sentPayment}
                    </button>
                  </div>
                </motion.div>
              )}

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

                  <p className="prototype-notice">{strings.previewNotice}</p>

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
                    />
                  </label>

                  {otpError && (
                    <p className="otp-error-text">{strings.enterOtp}</p>
                  )}

                  <div className="form-actions">
                    <button
                      className="modal-back-button"
                      onClick={() => setStep("payment")}
                      type="button"
                    >
                      <ChevronLeft size={18} />
                      {strings.back}
                    </button>
                    <button className="primary-button" type="submit">
                      {strings.verifyActivate}
                    </button>
                  </div>
                </motion.form>
              )}

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
                    {strings.welcome} {fullName || strings.member}.
                  </h2>
                  <p>{strings.cardNote}</p>
                  <div className="credential-card">
                    <span>{strings.membershipId}</span>
                    <strong>{membershipId}</strong>
                    <button
                      type="button"
                      aria-label="Copy membership ID"
                      onClick={() => copyValue(membershipId)}
                    >
                      <Copy size={15} />
                    </button>
                    <span>{strings.tempPassword}</span>
                    <strong>ATB@Welcome</strong>
                    <button
                      type="button"
                      aria-label="Copy temporary password"
                      onClick={() => copyValue("ATB@Welcome")}
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                  <div className="activation-note">
                    <CreditCard size={18} />
                    {strings.benefitsAvailable}
                  </div>
                  <button
                    className="primary-button modal-submit"
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
