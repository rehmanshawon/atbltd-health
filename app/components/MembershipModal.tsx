"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, BanknoteArrowUp, Check, CheckCircle2, ChevronLeft, Copy, CreditCard, LockKeyhole, ShieldCheck, Smartphone, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

interface MembershipModalProps { isOpen: boolean; onClose: () => void; }
type EnrollmentStep = "details" | "payment" | "verification" | "complete";

const steps = ["Your details", "Payment", "Verify number"];
const gateways = ["bKash", "Nagad", "Rocket"];

export default function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<EnrollmentStep>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [membershipId, setMembershipId] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const close = () => { setStep("details"); setOtp(""); setOtpError(false); onClose(); };
  const submitDetails = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setMembershipId(`ATB-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`); setStep("payment"); };
  const verifyOtp = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (otp === "123456") { setStep("complete"); } else { setOtpError(true); } };
  const copyValue = (value: string) => navigator.clipboard?.writeText(value);
  const currentStep = step === "details" ? 0 : step === "payment" ? 1 : 2;

  return <AnimatePresence>{isOpen && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
    <motion.div role="dialog" aria-modal="true" aria-labelledby="membership-title" className="membership-modal membership-enrollment glass" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ ease: [0.16, 1, 0.3, 1] }} onMouseDown={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={close} aria-label="Close membership form"><X size={20} /></button>
      {step !== "complete" && <><p className="section-eyebrow">{t("ATB membership")}</p><h2 id="membership-title">{t("Your protection starts with clarity.")}</h2><div className="enrollment-steps" aria-label={`Step ${currentStep + 1} of 3`}>{steps.map((label, index) => <div key={label} className={index <= currentStep ? "enrollment-step active" : "enrollment-step"}><i>{index < currentStep ? <Check size={13} /> : index + 1}</i><span>{t(label)}</span></div>)}</div></>}
      <AnimatePresence mode="wait">
        {step === "details" && <motion.form key="details" onSubmit={submitDetails} className="enrollment-form" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
          <p className="modal-intro">{t("Tell us who you are. Your details are reviewed before membership is activated.")}</p>
          <div className="form-two-column"><label>{t("Full name")}<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={t("Your full name")} /></label><label>{t("Mobile number")}<input required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01XXXXXXXXX" /></label></div>
          <label>{t("Email address")} <span>{t("(optional)")}</span><input type="email" autoComplete="email" placeholder="you@example.com" /></label>
          <label>{t("National ID number")}<input required inputMode="numeric" autoComplete="off" placeholder={t("Your NID number")} /></label>
          <label>{t("Permanent address")}<textarea required rows={2} placeholder={t("Village / area, thana, district")} /></label>
          <label>{t("Current address")}<textarea required rows={2} placeholder={t("Your current address")} /></label>
          <label>{t("Referral ID")} <span>{t("(optional)")}</span><input autoComplete="off" placeholder={t("Agent referral ID, if you have one")} /></label>
          <label className="agreement-field"><input type="checkbox" required /><span>{t("I confirm these details are accurate and I agree to the membership terms and verification process.")}</span></label>
          <button className="primary-button modal-submit" type="submit">{t("Continue to payment")}</button>
        </motion.form>}

        {step === "payment" && <motion.div key="payment" className="enrollment-screen" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
          <div className="payment-summary"><span>{t("First-year membership")}</span><strong>1,000 BDT</strong><small>{t("Renewal is 850 BDT per year.")}</small></div>
          <p className="modal-intro">{t("Choose how you would like to pay. Online merchant checkout will be added when the respective accounts are approved.")}</p>
          <div className="gateway-list"><button className="send-money-card" type="button"><span className="gateway-symbol"><BanknoteArrowUp size={20} /></span><span><strong>{t("Send money")}</strong><small>{t("Available now — recipient details confirmed by customer care")}</small></span><BadgeCheck size={20} /></button>{gateways.map((gateway) => <button key={gateway} className="gateway-card" type="button" disabled><span className="gateway-symbol"><Smartphone size={19} /></span><span><strong>{gateway}</strong><small>{t("Merchant checkout coming soon")}</small></span><LockKeyhole size={17} /></button>)}</div>
          <div className="payment-assistance"><ShieldCheck size={17} /><span>{t("For your safety, confirm the recipient name with ATB customer care before sending money. Do not send funds to an unverified number.")}</span></div>
          <div className="form-actions"><button className="modal-back-button" onClick={() => setStep("details")} type="button"><ChevronLeft size={18} />{t("Back")}</button><button className="primary-button" onClick={() => setStep("verification")} type="button">{t("I’ve sent the payment")}</button></div>
        </motion.div>}

        {step === "verification" && <motion.form key="verification" onSubmit={verifyOtp} className="enrollment-form enrollment-screen" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
          <div className="verification-orb"><Smartphone size={27} /></div><h3>{t("Verify your mobile number")}</h3><p className="modal-intro">{t("Once payment is confirmed, a six-digit OTP will be sent to")} <strong>{phone || t("your mobile number")}</strong>.</p>
          <p className="prototype-notice">{t("Frontend preview: use")} <strong>123456</strong> {t("to view the confirmation state. Production OTP and payment confirmation require the backend.")}</p>
          <label>{t("One-time password")}<input className={otpError ? "otp-input otp-error" : "otp-input"} required inputMode="numeric" maxLength={6} value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "")); setOtpError(false); }} placeholder="••••••" /></label>{otpError && <p className="otp-error-text">{t("Enter the six-digit preview code to continue.")}</p>}
          <div className="form-actions"><button className="modal-back-button" onClick={() => setStep("payment")} type="button"><ChevronLeft size={18} />{t("Back")}</button><button className="primary-button" type="submit">{t("Verify & activate")}</button></div>
        </motion.form>}

        {step === "complete" && <motion.div key="complete" className="membership-complete" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}><CheckCircle2 size={52} /><p className="section-eyebrow">{t("Membership preview")}</p><h2>{t("Welcome,")} {fullName || t("member")}.</h2><p>{t("Your membership card and login details will be sent by SMS after real payment and identity verification are connected.")}</p><div className="credential-card"><span>{t("Membership ID")}</span><strong>{membershipId}</strong><button type="button" aria-label="Copy membership ID" onClick={() => copyValue(membershipId)}><Copy size={15} /></button><span>{t("Temporary password")}</span><strong>ATB@Welcome</strong><button type="button" aria-label="Copy temporary password" onClick={() => copyValue("ATB@Welcome")}><Copy size={15} /></button></div><div className="activation-note"><CreditCard size={18} />{t("Your medical benefits become available one month after the membership date, subject to the membership rules.")}</div><button className="primary-button modal-submit" onClick={close}>{t("Done")}</button></motion.div>}
      </AnimatePresence>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
