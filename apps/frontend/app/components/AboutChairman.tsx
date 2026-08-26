"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award, Briefcase, GraduationCap, Building2 } from "lucide-react";
import SectionHeading from "./SectionHeading";

interface AboutChairmanProps {
  strings: {
    eyebrow: string;
    title: string;
    description: string;
    currentRoles: string;
    chairmanTitle: string;
    directorTitle: string;
    executiveDirectorTitle: string;
    advisorTitle: string;
    careerTitle: string;
    educationTitle: string;
    roles: {
      chairman: string;
      director1: string;
      director2: string;
      director3: string;
      executiveDirector: string;
      advisor1: string;
      advisor2: string;
      career1: string;
      career2: string;
      career3: string;
      education1: string;
      education2: string;
      education3: string;
    };
  };
}

export default function AboutChairman({ strings }: AboutChairmanProps) {
  const currentRoles = [
    { icon: Award, text: strings.roles.chairman },
    { icon: Briefcase, text: strings.roles.director1 },
    { icon: Briefcase, text: strings.roles.director2 },
    { icon: Briefcase, text: strings.roles.director3 },
    { icon: Award, text: strings.roles.executiveDirector },
    { icon: Building2, text: strings.roles.advisor1 },
    { icon: Building2, text: strings.roles.advisor2 },
  ];

  const career = [
    strings.roles.career1,
    strings.roles.career2,
    strings.roles.career3,
  ];

  const education = [
    strings.roles.education1,
    strings.roles.education2,
    strings.roles.education3,
  ];

  return (
    <section id="about-chairman" className="section-space">
      <div className="container-xl">
        <SectionHeading
          centered
          eyebrow={strings.eyebrow}
          title={strings.title}
          description={strings.description}
        />

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-start">
          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative h-[500px] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src="/images/chairman-about.png"
                alt="A.K.M. Moshiur Rahman"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md rounded-xl p-4">
              <p className="text-white font-bold text-lg">
                এ.কে.এম মশিউর রহমান
              </p>
              <p className="text-red-300 text-sm">
                চেয়ারম্যান, আস্থা ট্রিটমেন্ট বিলস লিমিটেড
              </p>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Current Roles */}
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Award size={20} className="text-red-400" />
                {strings.currentRoles}
              </h3>
              <div className="space-y-3">
                {currentRoles.map((role, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <role.icon
                      size={16}
                      className="text-red-400 mt-0.5 shrink-0"
                    />
                    <p className="text-white/80 text-sm">{role.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career */}
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-red-400" />
                {strings.careerTitle}
              </h3>
              <ul className="space-y-2">
                {career.map((item, i) => (
                  <li
                    key={i}
                    className="text-white/80 text-sm flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Education */}
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-red-400" />
                {strings.educationTitle}
              </h3>
              <ul className="space-y-2">
                {education.map((item, i) => (
                  <li
                    key={i}
                    className="text-white/80 text-sm flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
