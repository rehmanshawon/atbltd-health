'use client';

import { CheckCircle2, CreditCard, Gift, Text } from 'lucide-react';

interface CompleteStepProps {
  strings: {
    membershipPreview: string;
    applicationReceived: string;
    applicationReceivedDesc: string;
    pendingVerificationNote: string;
    whatHappensNext: string;
    benefits: string;
    done: string;
  };
  onClose: () => void;
}

export default function CompleteStep({ strings, onClose }: CompleteStepProps) {
  return (
    <div className="membership-complete">
      <CheckCircle2 size={52} />
      <p className="section-eyebrow">{strings.membershipPreview}</p>
      <h2>{strings.applicationReceived || 'Application Received!'}</h2>
      <p>{strings.applicationReceivedDesc}</p>

      <div className="activation-note">
        <Gift size={18} />
        {strings.pendingVerificationNote || 'Payment verification in progress.'}
      </div>

      <div className="activation-note" style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
        <Text size={18} />
        {strings.whatHappensNext || 'SMS with login credentials will be sent after verification.'}
      </div>

      <div className="activation-note" style={{ background: 'rgba(37, 99, 235, 0.12)' }}>
        <CreditCard size={18} />
        {strings.benefits || 'Get 12,000 BDT benefits'}
      </div>

      <button className="secondary-button modal-submit" onClick={onClose}>
        {strings.done}
      </button>
    </div>
  );
}
