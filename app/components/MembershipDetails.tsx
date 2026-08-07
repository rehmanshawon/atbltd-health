"use client";

import { motion } from "framer-motion";
import { FileCheck2, ShieldCheck, WalletCards } from "lucide-react";
import { MEMBERSHIP_DETAILS } from "../lib/constants";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";

const detailIcons = [WalletCards, ShieldCheck, FileCheck2];

export default function MembershipDetails() {
  const { t } = useLanguage();
  return (
    <section
      id="membership-details"
      className="section-space membership-details-section"
    >
      <div className="container-xl">
        <SectionHeading
          centered
          eyebrow="Know before you join"
          title="A membership you can understand clearly."
          description="We believe confidence begins with plain information. Here are the essential details of an ATB Ltd membership."
        />
        <div className="membership-details-grid">
          {MEMBERSHIP_DETAILS.map((detail, index) => {
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
                <p>{t(detail.label)}</p>
                <strong>{t(detail.value)}</strong>
                <span>{t(detail.detail)}</span>
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
          {t("Assistance is subject to the membership terms, eligibility, and submission of the required documents.")}
        </motion.p>
      </div>
    </section>
  );
}
