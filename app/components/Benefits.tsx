"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BENEFITS } from "../lib/constants";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";

function BenefitArtwork({ type }: { type: string }) {
  return (
    <div className={`benefit-art benefit-art-${type}`} aria-hidden="true">
      <div className="art-halo" />
      <div className="art-card art-card-back" />
      <div className="art-card art-card-front">
        <span>{type === "coverage" ? "12,000" : "365"}</span>
        <small>
          {type === "coverage" ? "BDT of support" : "days of confidence"}
        </small>
      </div>
      <div className="art-orb" />
    </div>
  );
}

export default function Benefits() {
  const { t } = useLanguage();
  return (
    <section id="benefits" className="section-space benefits-section">
      <div className="container-xl">
        <SectionHeading
          eyebrow="Built around your wellbeing"
          title="Protection with a calm, human center."
          description="Every detail of ATB Ltd is designed to make healthcare support feel more accessible and less overwhelming."
        />
        <div className="benefits-list">
          {BENEFITS.map((benefit, index) => (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={`benefit-row ${index % 2 ? "benefit-row-reverse" : ""}`}
            >
              <BenefitArtwork type={benefit.artwork} />
              <div className="benefit-copy glass-card">
                <p className="section-eyebrow">{t(benefit.eyebrow)}</p>
                <h3>{t(benefit.title)}</h3>
                <p className="benefit-description">{t(benefit.description)}</p>
                <ul>
                  {benefit.points.map((point) => (
                    <li key={point}>
                      <Check size={17} />
                      {t(point)}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
