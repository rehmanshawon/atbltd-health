"use client";

import { motion } from "framer-motion";
import { FileCheck2, ShieldCheck, WalletCards } from "lucide-react";
import { MEMBERSHIP_DETAILS } from "../lib/constants";
import SectionHeading from "./SectionHeading";

const detailIcons = [WalletCards, ShieldCheck, FileCheck2];

interface MembershipDetailsProps {
  strings: {
    heading: string;
    title: string;
    description: string;
    annualMembership: string;
    annualMembershipValue: string;
    annualMembershipDetail: string;
    coveragePeriod: string;
    coveragePeriodValue: string;
    coveragePeriodDetail: string;
    medicalAssistance: string;
    medicalAssistanceValue: string;
    medicalAssistanceDetail: string;
    note: string;
  };
}

export default function MembershipDetails({ strings }: MembershipDetailsProps) {
  const details = [
    {
      label: strings.annualMembership,
      value: strings.annualMembershipValue,
      detail: strings.annualMembershipDetail,
    },
    {
      label: strings.coveragePeriod,
      value: strings.coveragePeriodValue,
      detail: strings.coveragePeriodDetail,
    },
    {
      label: strings.medicalAssistance,
      value: strings.medicalAssistanceValue,
      detail: strings.medicalAssistanceDetail,
    },
  ];

  return (
    <section
      id="membership-details"
      className="section-space membership-details-section"
    >
      <div className="container-xl">
        <SectionHeading
          centered
          eyebrow={strings.heading}
          title={strings.title}
          description={strings.description}
        />
        <div className="membership-details-grid">
          {details.map((detail, index) => {
            const Icon = detailIcons[index];
            return (
              <motion.article
                key={detail.label}
                className="membership-detail-card glass-card"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -7 }}
              >
                <div className="detail-icon">
                  <Icon size={23} strokeWidth={1.7} />
                </div>
                <p>{detail.label}</p>
                <strong>{detail.value}</strong>
                <span>{detail.detail}</span>
              </motion.article>
            );
          })}
        </div>
        <motion.p
          className="membership-note"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {strings.note}
        </motion.p>
      </div>
    </section>
  );
}
