"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface ChairmanProps {
  strings: {
    eyebrow: string;
    title: string;
    body1: string;
    body2: string;
    signature: string;
    name: string;
    role: string;
    caption: string;
  };
}

export default function ChairmanMessage({ strings }: ChairmanProps) {
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
            <div className="chairman-photo-caption">{strings.caption}</div>
          </div>
          <div className="chairman-copy">
            <p className="section-eyebrow">{strings.eyebrow}</p>
            <Quote className="chairman-quote" size={43} strokeWidth={1.15} />
            <h2>{strings.title}</h2>
            <p>{strings.body1}</p>
            <p>{strings.body2}</p>
            <div
              className="signature-placeholder"
              aria-label="Signature placeholder for A.K.M. Moshiur Rahman"
            >
              <span>{strings.signature}</span>
            </div>
            <div className="chairman-name">
              <strong>{strings.name}</strong>
              <span>{strings.role}</span>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
