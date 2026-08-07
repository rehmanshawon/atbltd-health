"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  Upload,
  FileCheck,
  Banknote,
} from "lucide-react";
import SectionHeading from "./SectionHeading";

interface ClaimWorkflowProps {
  strings: {
    eyebrow: string;
    title: string;
    description: string;
    overviewTitle: string;
    workflowTitle: string;
    steps: {
      number: string;
      title: string;
      activity: string;
      timeframe: string;
      team: string;
    }[];
    sequenceTitle: string;
    sequence: {
      title: string;
      copy: string[];
    }[];
    note: string;
  };
}

export default function ClaimWorkflow({ strings }: ClaimWorkflowProps) {
  const icons = [Phone, Upload, FileCheck, FileCheck, Banknote];

  return (
    <section id="claim-process" className="section-space">
      <div className="container-xl">
        <SectionHeading
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
          centered
        />

        <div className="mt-12">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white">
              {strings.overviewTitle}
            </h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {strings.steps.map((step, index) => {
              const Icon = icons[index] ?? FileCheck;
              const isLast = index === strings.steps.length - 1;

              return (
                <div key={step.number} className="relative">
                  <motion.article
                    initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card h-full p-6 text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                        <Icon size={18} />
                      </span>
                      <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90">
                        {step.number}
                      </span>
                    </div>

                    <div className="mt-7">
                      <h4 className="text-lg font-bold leading-snug text-white">
                        {step.title}
                      </h4>
                      <p className="mt-4 text-sm leading-6 text-white/88">
                        {step.activity}
                      </p>
                      <div className="mt-5 rounded-2xl border border-white/12 bg-white/6 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-200">
                          TAT
                        </div>
                        <div className="mt-2 text-sm font-semibold text-white">
                          {step.timeframe}
                        </div>
                      </div>
                      <div className="mt-4 text-xs font-bold uppercase tracking-wide text-white/78">
                        {step.team}
                      </div>
                    </div>
                  </motion.article>

                  {!isLast && (
                    <div className="hidden lg:flex items-center justify-center absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                      <span className="rounded-full bg-white/10 p-2 text-white/90">
                        <ArrowRight size={16} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14">
          <div className="mb-7">
            <h3 className="text-2xl font-bold text-white">
              {strings.workflowTitle}
            </h3>
          </div>
          <div className="grid gap-5">
            {strings.sequence.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-6 text-white"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500/90 font-black text-white">
                    {index + 1}
                  </span>
                  <h4 className="text-xl font-bold text-white">{item.title}</h4>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {item.copy.map((line) => (
                    <div
                      key={line}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                    >
                      <span className="mt-1 text-emerald-300">
                        <CheckCircle2 size={15} />
                      </span>
                      <span className="text-sm leading-6 text-white/90">
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/16 bg-white/7 px-6 py-5 text-sm leading-7 text-white/90">
          {strings.note}
        </div>
      </div>
    </section>
  );
}
