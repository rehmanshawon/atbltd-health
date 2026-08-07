"use client";

import { useState } from "react";
import BackgroundGlow from "./components/BackgroundGlow";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Benefits from "./components/Benefits";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import MembershipModal from "./components/MembershipModal";
import MembershipDetails from "./components/MembershipDetails";
import ChairmanMessage from "./components/ChairmanMessage";
import BenefitEligibility from "./components/BenefitEligibility";
import DiseaseCoverage from "./components/DiseaseCoverage";
import { en } from "./i18n/en";
import { bn } from "./i18n/bn";

export default function Home() {
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("bn");
  const locale = language === "bn" ? bn : en;

  return (
    <main className="relative overflow-hidden">
      <BackgroundGlow />

      <Navbar
        onJoin={() => setIsMembershipOpen(true)}
        strings={locale.nav}
        language={language}
        onLanguageChange={() => setLanguage(language === "bn" ? "en" : "bn")}
      />

      <Hero
        onJoin={() => setIsMembershipOpen(true)}
        strings={locale.hero}
        statsStrings={locale.stats}
      />
      <MembershipDetails strings={locale.membership} />
      <ChairmanMessage strings={locale.chairman} />
      <HowItWorks strings={locale.howItWorks} />
      <BenefitEligibility strings={locale.eligibility} />
      <DiseaseCoverage strings={locale.diseaseCoverage} />
      <Benefits strings={locale.benefits} />

      <FAQ strings={locale.faq} />
      <Footer strings={locale.footer} />
      <MembershipModal
        isOpen={isMembershipOpen}
        onClose={() => setIsMembershipOpen(false)}
        strings={locale.modal}
      />
    </main>
  );
}
