"use client";

import { motion } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}

export default function SectionHeading({ eyebrow, title, description, centered }: SectionHeadingProps) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <p className="section-eyebrow">{t(eyebrow)}</p>
      <h2 className="section-title mt-5">{t(title)}</h2>
      <p className="section-subtitle">{t(description)}</p>
    </motion.div>
  );
}
