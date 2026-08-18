"use client";

import { motion } from "framer-motion";

import HeroVideo from "./HeroVideo";
import HeroStats from "./HeroStats";
import CTAButton from "./CTAButton";

interface Props {
  onJoin?: () => void;
  strings: {
    kicker: string;
    trustedMembers: string;
    title: string;
    titleTwo: string;
    subtitleLead: string;
    subtitleSupport: string;
    subtitlePrice: string;
    becomeMember: string;
    learnHowItWorks: string;
    scroll: string;
    login: string;
  };
  statsStrings: {
    maximumCoverage: string;
    hospitalStay: string;
    monthsValidity: string;
  };
}

export default function Hero({ onJoin, strings, statsStrings }: Props) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroVideo />

      <div className="relative z-10 container-xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Trust Badge */}

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="company-kicker"
            style={{ marginTop: "10rem" }}
          >
            {strings.kicker}
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
            className="
              inline-flex
              items-center
              gap-3
              glass
              rounded-full
              px-6
              py-3
              mt-4
              mb-10
            "
          >
            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

            <span className="text-white/80">{strings.trustedMembers}</span>
          </motion.div>

          {/* Heading */}

          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
            }}
            className="
              text-[clamp(3.5rem,9vw,7rem)]
              leading-[1.1]
              font-black
              tracking-[-0.05em]
            "
          >
            {strings.title}
            <br />
            <span
              className="bg-gradient-to-r from-white via-white to-red-400 bg-clip-text text-transparent"
              //style={{ display: "block", marginTop: "1rem" }}
            >
              {strings.titleTwo}
            </span>
          </motion.h1>

          {/* Subtitle */}

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.55,
            }}
            className="
              mt-10
              max-w-3xl
              mx-auto
              text-xl
              leading-9
              text-white/70
            "
          >
            {strings.subtitleLead}
            {/* <span className="text-white font-bold"> 12,000 BDT </span> */}
            {strings.subtitleSupport}
            <span className="text-white font-bold">
              {strings.subtitlePrice}
            </span>
          </motion.p>

          {/* Buttons */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.7,
            }}
            className="
              flex
              flex-col
              sm:flex-row
              justify-center
              gap-5
              mt-12
            "
          >
            <CTAButton onClick={onJoin}>{strings.becomeMember}</CTAButton>
            <a className="secondary-button" href="/login">
              {strings.login || "Login"}
            </a>
            <a className="secondary-button" href="#how-it-works">
              {strings.learnHowItWorks}
            </a>
          </motion.div>

          <HeroStats strings={{ stats: statsStrings }} />
        </motion.div>
      </div>

      {/* Scroll Indicator */}

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 1.4,
        }}
        className="
          absolute
          bottom-10
          left-1/2
          -translate-x-1/2
          text-white/50
          flex
          flex-col
          items-center
          gap-3
        "
      >
        <span className="text-sm tracking-[0.25em] uppercase">
          {strings.scroll}
        </span>

        <div
          className="
            h-12
            w-[2px]
            rounded-full
            bg-white/20
            overflow-hidden
          "
        >
          <motion.div
            animate={{
              y: [-20, 40],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
            className="
              h-5
              bg-white
              rounded-full
            "
          />
        </div>
      </motion.div>
    </section>
  );
}
