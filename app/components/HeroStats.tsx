"use client";

import { motion } from "framer-motion";
import { STATS } from "../lib/constants";
import { useLanguage } from "./LanguageProvider";

export default function HeroStats() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.9,
        duration: 0.8,
      }}
      className="glass w-full max-w-3xl justify-self-center rounded-[30px] p-8 mt-24 mx-auto"
    >
      <div className="grid w-full grid-cols-3 place-items-center">
        {STATS.map((item, index) => (
          <div
            key={item.label}
            className={`
              w-full
              text-center
              px-6

              ${index !== STATS.length - 1 ? "border-r border-white/10" : ""}
            `}
          >
            <h3 className="text-4xl font-black tracking-tight text-white">
              {item.value}
            </h3>

            <p className="text-white/60 mt-2">{t(item.label)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
