"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface DiseaseCoverageProps {
  strings: {
    eyebrow: string;
    title: string;
    description: string;
    coveredHeading: string;
    coveredDescription: string;
    coveredList: string[];
    notCoveredHeading: string;
    notCoveredDescription: string;
    notCoveredList: string[];
    note: string;
  };
}

export default function DiseaseCoverage({ strings }: DiseaseCoverageProps) {
  const cardStyles = [
    "border",
    "backdrop-blur-xl",
    "rounded-3xl",
    "p-8",
    "transition-all duration-300 ease-in-out",
    "hover:-translate-y-2",
  ].join(" ");

  const includedCardStyles = `${cardStyles} border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40`;
  const excludedCardStyles = `${cardStyles} border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40`;

  return (
    <section id="coverage-scope" className="section-space">
      <div className="container-xl">
        <SectionHeading
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
          centered
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Included Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={includedCardStyles}
          >
            <div className="mb-6 flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <Check size={24} />
              </span>
              <h3 className="text-2xl font-bold text-white">
                {strings.coveredHeading}
              </h3>
            </div>
            <p className="mb-6 text-base leading-7 text-white/80">
              {strings.coveredDescription}
            </p>
            <ul className="list-disc space-y-3 pl-5 marker:text-emerald-400">
              {strings.coveredList.map((item) => (
                <li key={item} className="leading-7 text-white/90">
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>

          {/* Excluded Card */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className={excludedCardStyles}
          >
            <div className="mb-6 flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-300">
                <X size={24} />
              </span>
              <h3 className="text-2xl font-bold text-white">
                {strings.notCoveredHeading}
              </h3>
            </div>
            <p className="mb-6 text-base leading-7 text-white/80">
              {strings.notCoveredDescription}
            </p>
            <ul className="list-disc space-y-3 pl-5 marker:text-rose-400">
              {strings.notCoveredList.map((item) => (
                <li key={item} className="leading-7 text-white/90">
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>
        </div>

        {/* Note Box */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm leading-7 text-white/70 backdrop-blur-sm">
          <span className="font-semibold text-white/90">Please Note:</span>{" "}
          {strings.note}
        </div>
      </div>
    </section>
  );
}
