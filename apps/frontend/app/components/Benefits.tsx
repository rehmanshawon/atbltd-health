"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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

function BenefitCard({
  index,
  artwork,
  eyebrow,
  title,
  description,
  points,
}: {
  index: number;
  artwork: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const artY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const copyY = useTransform(scrollYProgress, [0, 1], [20, -20]);

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 48, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15, margin: "-60px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`benefit-row ${index % 2 ? "benefit-row-reverse" : ""}`}
    >
      <motion.div style={{ y: artY }} className="benefit-art-wrap">
        <BenefitArtwork type={artwork} />
      </motion.div>

      <motion.div
        style={{ y: copyY }}
        className="benefit-copy glass-card premium-card"
      >
        <p className="section-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p className="benefit-description">{description}</p>
        <ul>
          {points.map((point, i) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.2 + i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="check-icon">
                <Check size={17} />
              </span>
              {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.article>
  );
}

export default function Benefits({ strings }: BenefitsProps) {
  const benefits = [
    {
      artwork: "coverage",
      eyebrow: strings.meaningfulCover,
      title: strings.meaningfulCoverTitle,
      description: strings.meaningfulCoverDescription,
      points: strings.meaningfulPoints,
    },
    {
      artwork: "clarity",
      eyebrow: strings.madeForLife,
      title: strings.madeForLifeTitle,
      description: strings.madeForLifeDescription,
      points: strings.madeForLifePoints,
    },
  ];

  return (
    <section id="benefits" className="section-space benefits-section">
      <div className="container-xl">
        <SectionHeading
          eyebrow={strings.heading}
          title={strings.title}
          description={strings.description}
        />
        <div className="benefits-list">
          {benefits.map((benefit, index) => (
            <BenefitCard key={benefit.artwork} index={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
}
