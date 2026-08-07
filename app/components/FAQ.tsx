"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQS } from "../lib/constants";
import SectionHeading from "./SectionHeading";

interface FAQProps {
  strings: {
    eyebrow: string;
    title: string;
    description: string;
    questions: {
      membershipProvide: string;
      membershipValid: string;
      membershipCost: string;
      getStarted: string;
      joinMind: string;
    };
    answers: {
      membershipProvide: string;
      membershipValid: string;
      membershipCost: string;
      getStarted: string;
      joinMind: string;
    };
  };
}

export default function FAQ({ strings }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqEntries = [
    {
      question: strings.questions.membershipProvide,
      answer: strings.answers.membershipProvide,
    },
    {
      question: strings.questions.membershipValid,
      answer: strings.answers.membershipValid,
    },
    {
      question: strings.questions.membershipCost,
      answer: strings.answers.membershipCost,
    },
    {
      question: strings.questions.getStarted,
      answer: strings.answers.getStarted,
    },
    {
      question: strings.questions.joinMind,
      answer: strings.answers.joinMind,
    },
  ];

  return (
    <section id="about" className="section-space faq-section">
      <div className="container-xl faq-layout">
        <SectionHeading
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
        />
        <div className="faq-list">
          {faqEntries.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                key={faq.question}
                className={`faq-item glass-card ${isOpen ? "faq-open" : ""}`}
              >
                <button
                  className="faq-trigger"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={21}
                    className={isOpen ? "rotate-180" : ""}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: "easeOut" }}
                      className="faq-answer"
                    >
                      <p>{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
