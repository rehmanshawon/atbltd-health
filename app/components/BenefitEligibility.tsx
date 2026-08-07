"use client";

import { motion } from "framer-motion";
import { CalendarDays, ClipboardCheck, HeartPulse, Landmark } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";

const rules = [
  { icon: CalendarDays, title: "One-month activation", copy: "Benefits can be used one month after your membership date." },
  { icon: HeartPulse, title: "24-hour hospital stay", copy: "Treatment support applies when an eligible hospital stay is at least 24 hours." },
  { icon: Landmark, title: "Up to 12,000 BDT yearly", copy: "Your available annual support reduces only as eligible treatment bills are used." },
  { icon: ClipboardCheck, title: "Document-led review", copy: "Keep hospital and treatment documents ready for the review process." },
];

export default function BenefitEligibility() {
  const { t } = useLanguage();
  return <section id="benefit-rules" className="section-space eligibility-section"><div className="container-xl"><SectionHeading centered eyebrow="Before you need care" title="The essentials, made transparent." description="These are the key rules for using ATB medical treatment support. Please review the full membership terms before joining." /><div className="eligibility-grid">{rules.map((rule, index) => { const Icon = rule.icon; return <motion.article key={rule.title} className="eligibility-card glass-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .09, duration: .55 }}><div className="detail-icon"><Icon size={23} strokeWidth={1.7} /></div><h3>{t(rule.title)}</h3><p>{t(rule.copy)}</p></motion.article>; })}</div><p className="eligibility-note">{t("A member can receive up to 12,000 BDT in eligible treatment support in a membership year. Each request is subject to the applicable rules and review.")}</p></div></section>;
}
