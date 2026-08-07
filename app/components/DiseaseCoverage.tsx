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
  return (
    <section id="coverage-scope" className="section-space">
      <div className="container-xl">
        <SectionHeading
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
          centered
        />

        <div className="grid gap-8 lg:grid-cols-2 mt-12">
          <motion.article
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check size={20} />
              </span>
              <h3 className="text-2xl font-semibold text-slate-900">
                {strings.coveredHeading}
              </h3>
            </div>
            <p className="text-sm leading-7 text-slate-600 mb-6">
              {strings.coveredDescription}
            </p>
            <ul className="space-y-4">
              {strings.coveredList.map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="mt-1 text-emerald-600">
                    <Check size={16} />
                  </span>
                  <span className="text-slate-700 leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card p-8 border-rose-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <X size={20} />
              </span>
              <h3 className="text-2xl font-semibold text-slate-900">
                {strings.notCoveredHeading}
              </h3>
            </div>
            <p className="text-sm leading-7 text-slate-600 mb-6">
              {strings.notCoveredDescription}
            </p>
            <ul className="space-y-4">
              {strings.notCoveredList.map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="mt-1 text-rose-600">
                    <X size={16} />
                  </span>
                  <span className="text-slate-700 leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm leading-7 text-slate-700">
          {strings.note}
        </div>
      </div>
    </section>
  );
}
