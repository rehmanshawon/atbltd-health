"use client";

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
import { LanguageProvider } from "./components/LanguageProvider";
import { useState } from "react";

export default function Home() {
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  return (
    <LanguageProvider>
      <main className="relative overflow-hidden">
        <BackgroundGlow />

        <Navbar onJoin={() => setIsMembershipOpen(true)} />

        <Hero onJoin={() => setIsMembershipOpen(true)} />
        <MembershipDetails />
        <ChairmanMessage />
        <HowItWorks />
        <BenefitEligibility />
        <Benefits />

        <FAQ />
        <Footer />
        <MembershipModal
          isOpen={isMembershipOpen}
          onClose={() => setIsMembershipOpen(false)}
        />
      </main>
    </LanguageProvider>
  );
}
