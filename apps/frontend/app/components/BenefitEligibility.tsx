"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  Landmark,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

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
