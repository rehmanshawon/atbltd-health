"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { STATS } from "../lib/constants";

function AnimatedNumber({
  value,
  isVisible,
}: {
  value: string;
  isVisible: boolean;
}) {
  const [displayValue, setDisplayValue] = useState("0");
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const start = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * numericValue);
      setDisplayValue(current.toLocaleString() + suffix);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, numericValue, suffix]);

  return <span>{displayValue}</span>;
}

export default function HeroStats({ strings }: HeroStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.8 }}
      className="glass w-full max-w-3xl justify-self-center rounded-[30px] p-8 mt-24 mx-auto"
    >
      <div className="grid w-full grid-cols-3 place-items-center">
        {STATS.map((item, index) => (
          <div
            key={item.label}
            className={`w-full text-center px-6 ${index !== STATS.length - 1 ? "border-r border-white/10" : ""}`}
          >
            <h3 className="text-4xl font-black tracking-tight text-white">
              <AnimatedNumber value={item.value} isVisible={isVisible} />
            </h3>
            <p className="text-white/60 mt-2">
              {
                strings.stats[
                  index === 0
                    ? "maximumCoverage"
                    : index === 1
                      ? "hospitalStay"
                      : "monthsValidity"
                ]
              }
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
