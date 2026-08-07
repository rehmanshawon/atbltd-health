"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  Landmark,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

const rules = [
  {
    icon: CalendarDays,
    title: "One-month activation",
    copy: "Benefits can be used one month after your membership date.",
  },
  {
    icon: HeartPulse,
    title: "24-hour hospital stay",
    copy: "Treatment support applies when an eligible hospital stay is at least 24 hours.",
  },
  {
    icon: Landmark,
    title: "Up to 12,000 BDT yearly",
    copy: "Your available annual support reduces only as eligible treatment bills are used.",
  },
  {
    icon: ClipboardCheck,
    title: "Document-led review",
    copy: "Keep hospital and treatment documents ready for the review process.",
  },
];

interface BenefitEligibilityProps {
  strings: {
    eyebrow: string;
    title: string;
    description: string;
    rule1Title: string;
    rule1Copy: string;
    rule2Title: string;
    rule2Copy: string;
    rule3Title: string;
    rule3Copy: string;
    rule4Title: string;
    rule4Copy: string;
    note: string;
  };
}

export default function BenefitEligibility({
  strings,
}: BenefitEligibilityProps) {
  const eligibleRules = [
    { icon: CalendarDays, title: strings.rule1Title, copy: strings.rule1Copy },
    { icon: HeartPulse, title: strings.rule2Title, copy: strings.rule2Copy },
    { icon: Landmark, title: strings.rule3Title, copy: strings.rule3Copy },
    {
      icon: ClipboardCheck,
      title: strings.rule4Title,
      copy: strings.rule4Copy,
    },
  ];

  return (
    <section id="benefit-rules" className="section-space eligibility-section">
      <div className="container-xl">
        <SectionHeading
          centered
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
        />
        <div className="eligibility-grid">
          {eligibleRules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <motion.article
                key={rule.title}
                className="eligibility-card glass-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.09, duration: 0.55 }}
              >
                <div className="detail-icon">
                  <Icon size={23} strokeWidth={1.7} />
                </div>
                <h3>{rule.title}</h3>
                <p>{rule.copy}</p>
              </motion.article>
            );
          })}
        </div>
        <p className="eligibility-note">{strings.note}</p>
      </div>
    </section>
  );
}
