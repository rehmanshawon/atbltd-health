"use client";

import { useState, useEffect } from "react";
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
import ClaimWorkflow from "./components/ClaimWorkflow";
import { en } from "./i18n/en";
import { bn } from "./i18n/bn";

export default function Home() {
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "bn">("bn");
  const locale = language === "bn" ? bn : en;

  useEffect(() => {
    document.documentElement.lang = language === "bn" ? "bn" : "en";
    document.body.style.fontFamily =
      language === "bn"
        ? "'Noto Sans Bengali', Times New Roman, serif"
        : "Arial, Helvetica, sans-serif";
  }, [language]);
  return (
    <div
      style={{
        background: `
        radial-gradient(circle at 15% 10%, rgba(211, 47, 47, 0.16), transparent 35%),
        radial-gradient(circle at 90% 25%, rgba(35, 90, 255, 0.12), transparent 38%),
        linear-gradient(180deg, #06152d 0%, #071b3a 30%, #081f48 65%, #05142b 100%)
      `,
        color: "white",
        minHeight: "100vh",
      }}
    >
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
        {/* <MembershipDetails strings={locale.membership} /> */}
        <ChairmanMessage strings={locale.chairman} />
        {/* <HowItWorks strings={locale.howItWorks} /> */}
        {/* <BenefitEligibility strings={locale.eligibility} /> */}
        <DiseaseCoverage strings={locale.diseaseCoverage} />
        <ClaimWorkflow strings={locale.claimWorkflow} />
        <Benefits strings={locale.benefits} />

        <FAQ strings={locale.faq} />
        <Footer strings={locale.footer} />
        <MembershipModal
          isOpen={isMembershipOpen}
          onClose={() => setIsMembershipOpen(false)}
          strings={locale.modal}
        />
      </main>
    </div>
  );
}
