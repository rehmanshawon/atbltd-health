"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0)",
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        className="section-eyebrow"
      >
        {eyebrow}
      </motion.p>

      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0)",
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        className="section-title mt-5"
      >
        {title}
      </motion.h2>

      <motion.p
        variants={{
          hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0)",
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
          },
        }}
        className="section-subtitle"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
