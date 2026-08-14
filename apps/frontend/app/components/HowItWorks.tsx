"use client";

import { motion } from "framer-motion";
import { CirclePlus, HeartPulse, ShieldCheck } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "../lib/constants";
import SectionHeading from "./SectionHeading";

const icons = { shield: ShieldCheck, heart: HeartPulse, plus: CirclePlus };

interface HowItWorksProps {
  strings: {
    title: string;
    subtitle: string;
    description: string;
    step1: string;
    step1Desc: string;
    step2: string;
    step2Desc: string;
    step3: string;
    step3Desc: string;
  };
}

export default function HowItWorks({ strings }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="section-space overflow-hidden">
      <div className="container-xl">
        <div className="premium-panel how-panel">
          <SectionHeading
            centered
            eyebrow={strings.title}
            title={strings.subtitle}
            description={strings.description}
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
                const copy =
                  index === 0
                    ? strings.step1Desc
                    : index === 1
                      ? strings.step2Desc
                      : strings.step3Desc;
                const label =
                  index === 0
                    ? strings.step1
                    : index === 1
                      ? strings.step2
                      : strings.step3;

                return (
                  <motion.article
                    key={step.number}
                    initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.25, margin: "-40px" }}
                    transition={{
                      duration: 0.7,
                      delay: index * 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{
                      y: -10,
                      scale: 1.02,
                      transition: { duration: 0.3, ease: "easeOut" },
                    }}
                    className="step-card premium-card"
                  >
                    <span className="step-number">{step.number}</span>
                    <motion.div
                      className="icon-orb"
                      whileHover={{ scale: 1.12, rotate: 6 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon size={27} strokeWidth={1.7} />
                    </motion.div>
                    <h3>{label}</h3>
                    <p>{copy}</p>
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
