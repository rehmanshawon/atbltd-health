"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQS } from "../lib/constants";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();
  return (
    <section id="about" className="section-space faq-section">
      <div className="container-xl faq-layout">
        <SectionHeading
          eyebrow="Clarity, from the beginning"
          title="Questions, answered simply."
          description="Everything you need to know before becoming an ATB Ltd member."
        />
        <div className="faq-list">
          {FAQS.map((faq, index) => {
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
                  <span>{t(faq.question)}</span>
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
                      <p>{t(faq.answer)}</p>
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
