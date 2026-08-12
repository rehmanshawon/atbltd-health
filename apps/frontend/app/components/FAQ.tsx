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
      q1: string;
      q2: string;
      q3: string;
      q4: string;
      q5: string;
      q6: string;
    };
    answers: {
      q1: string;
      q2: string;
      q3: string;
      q4: string;
      q5: string;
      q6: string;
    };
  };
}

export default function FAQ({ strings }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqEntries = [
    {
      question: strings.questions.q1,
      answer: strings.answers.q1,
    },
    {
      question: strings.questions.q2,
      answer: strings.answers.q2,
    },
    {
      question: strings.questions.q3,
      answer: strings.answers.q3,
    },
    {
      question: strings.questions.q4,
      answer: strings.answers.q4,
    },
    {
      question: strings.questions.q5,
      answer: strings.answers.q5,
    },
    {
      question: strings.questions.q6,
      answer: strings.answers.q6,
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
