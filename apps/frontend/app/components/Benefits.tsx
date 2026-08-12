"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { BENEFITS } from "../lib/constants";
import SectionHeading from "./SectionHeading";

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

interface BenefitsProps {
  strings: {
    heading: string;
    title: string;
    description: string;
    meaningfulCover: string;
    meaningfulCoverTitle: string;
    meaningfulCoverDescription: string;
    meaningfulPoints: string[];
    madeForLife: string;
    madeForLifeTitle: string;
    madeForLifeDescription: string;
    madeForLifePoints: string[];
  };
}

export default function Benefits({ strings }: BenefitsProps) {
  return (
    <section id="benefits" className="section-space benefits-section">
      <div className="container-xl">
        <SectionHeading
          eyebrow={strings.heading}
          title={strings.title}
          description={strings.description}
        />
        <div className="benefits-list">
          {BENEFITS.map((benefit, index) => {
            const points =
              index === 0
                ? strings.meaningfulPoints
                : strings.madeForLifePoints;
            const copy =
              index === 0
                ? strings.meaningfulCoverTitle
                : strings.madeForLifeTitle;
            const desc =
              index === 0
                ? strings.meaningfulCoverDescription
                : strings.madeForLifeDescription;
            const eyebrow =
              index === 0 ? strings.meaningfulCover : strings.madeForLife;
            return (
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
                  <p className="section-eyebrow">{eyebrow}</p>
                  <h3>{copy}</h3>
                  <p className="benefit-description">{desc}</p>
                  <ul>
                    {points.map((point) => (
                      <li key={point}>
                        <Check size={17} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
