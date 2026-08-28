'use client';

import { BadgeCheck, BanknoteArrowUp, ShieldCheck } from 'lucide-react';

interface PaymentSectionProps {
  strings: {
    firstYearMembership: string;
    renewal: string;
    choosePayment: string;
    sendMoney: string;
    sendMoneyDetail: string;
    safety: string;
    paymentMethod: string;
    required: string;
  };
  paymentMethod: string;
  senderAccount: string;
  isLoading: boolean;
  onPaymentMethodChange: (method: string) => void;
  onSenderAccountChange: (value: string) => void;
}

export default function PaymentSection({
  strings,
  paymentMethod,
  senderAccount,
  isLoading,
  onPaymentMethodChange,
  onSenderAccountChange,
}: PaymentSectionProps) {
  return (
    <>
      <div className="payment-summary" style={{ marginTop: '0.5rem' }}>
        <span>{strings.firstYearMembership}</span>
        <strong>1,000 BDT</strong>
        <small>{strings.renewal}</small>
      </div>

      <p className="modal-intro" style={{ marginTop: '0.5rem' }}>
        {strings.choosePayment}
      </p>

      <div className="gateway-list">
        <button
          className={`send-money-card ${paymentMethod === 'bkash' ? '' : ''}`}
          type="button"
          onClick={() => onPaymentMethodChange('bkash')}
          style={{
            borderColor: paymentMethod === 'bkash' ? '#ff8a8a' : undefined,
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
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#ff8a8a',
                display: 'block',
                marginTop: '4px',
              }}
            >
              01721719611
            </span>
            <small style={{ marginTop: '4px', display: 'block' }}>
              ATB Official bKash (Personal)
            </small>
          </span>
          <BadgeCheck size={20} />
        </button>
      </div>

      <label>
        {strings.paymentMethod || 'Sender Account (your bKash number)'}
        <span>{strings.required}</span>
        <input
          required
          inputMode="tel"
          value={senderAccount}
          onChange={(e) => onSenderAccountChange(e.target.value)}
          placeholder="01XXXXXXXXX"
          disabled={isLoading}
        />
      </label>

      <div className="payment-assistance">
        <ShieldCheck size={17} />
        <span>{strings.safety}</span>
      </div>
    </>
  );
}
