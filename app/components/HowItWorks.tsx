"use client";

import { motion } from "framer-motion";
import { CirclePlus, HeartPulse, ShieldCheck } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "../lib/constants";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";

const icons = { shield: ShieldCheck, heart: HeartPulse, plus: CirclePlus };

export default function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section id="how-it-works" className="section-space overflow-hidden">
      <div className="container-xl">
        <div className="premium-panel how-panel">
          <SectionHeading
            centered
            eyebrow="A thoughtful path to protection"
            title="Care, made beautifully simple."
            description="A clear membership experience from your first decision to the moment you need support."
          />
          <div className="steps-wrap">
            <motion.div
              className="steps-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="steps-grid">
              {HOW_IT_WORKS_STEPS.map((step, index) => {
                const Icon = icons[step.icon as keyof typeof icons];
                return (
                  <motion.article
                    key={step.number}
                    initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -9 }}
                    className="step-card"
                  >
                    <span className="step-number">{step.number}</span>
                    <motion.div className="icon-orb" whileHover={{ scale: 1.08, rotate: 4 }}>
                      <Icon size={27} strokeWidth={1.7} />
                    </motion.div>
                    <h3>{t(step.title)}</h3>
                    <p>{t(step.description)}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
