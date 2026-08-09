"use client";

import { motion } from "framer-motion";
import { Phone, Upload, FileCheck, Banknote } from "lucide-react";
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
      activity: string[];
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

        <div className="mt-16 mx-auto max-w-4xl">
          <div className="space-y-12">
            {strings.steps.map((step, index) => {
              const Icon = icons[index] ?? FileCheck;
              const isLast = index === strings.steps.length - 1;

              return (
                <div key={index} className="relative flex gap-8">
                  {/* Timeline Rail */}
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-300/50 bg-white/10 text-lg font-semibold text-red-200">
                        {index + 1}
                      </div>
                    </div>
                    {!isLast && (
                      <div className="mt-2 w-px flex-grow bg-white/15" />
                    )}
                  </div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.1,
                    }}
                    className="flex-1 pt-1"
                  >
                    <div className="mb-3 flex items-center gap-4">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/6 text-white">
                        <Icon size={18} />
                      </span>
                      <h4 className="text-xl font-bold leading-snug text-white">
                        {step.title}
                      </h4>
                    </div>
                    <ul className="ml-[56px] list-disc space-y-2 pl-5 text-sm leading-7 text-white/80 marker:text-red-300">
                      {step.activity.map((line, lineIndex) => (
                        <li key={lineIndex}>{line}</li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center text-sm text-white/70">
          {strings.note}
        </div>
      </div>
    </section>
  );
}
