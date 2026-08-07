"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function ChairmanMessage() {
  const { t } = useLanguage();
  return (
    <section id="chairman-message" className="section-space chairman-section">
      <div className="container-xl">
        <motion.article
          className="chairman-card premium-panel"
          initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="chairman-portrait-wrap">
            <div className="chairman-portrait-glow" />
            <Image
              src="/images/chairman.png"
              alt="A.K.M. Moshiur Rahman, Founder and Chairman"
              fill
              sizes="(max-width: 850px) 100vw, 42vw"
              className="chairman-portrait"
            />
            <div className="chairman-photo-caption">{t("Founder’s message")}</div>
          </div>
          <div className="chairman-copy">
            <p className="section-eyebrow">{t("A note from our chairman")}</p>
            <Quote className="chairman-quote" size={43} strokeWidth={1.15} />
            <h2>{t("Care should never feel out of reach.")}</h2>
            <p>{t("At ATB, we believe that a sudden health need should not force a family to face it alone. Our purpose is simple: make practical healthcare support more accessible, with a membership people can understand and trust.")}</p>
            <p>{t("We are committed to being clear about what membership includes and how assistance is considered—so that every member can make an informed decision with confidence.")}</p>
            <div
              className="signature-placeholder"
              aria-label="Signature placeholder for A.K.M. Moshiur Rahman"
            >
              <span>{t("Signature to be added")}</span>
            </div>
            <div className="chairman-name">
              <strong>A.K.M. Moshiur Rahman</strong>
              <span>{t("Founder & Chairman, ATB Health")}</span>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
