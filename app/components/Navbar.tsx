"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";

interface NavbarProps {
  onJoin?: () => void;
}

export default function Navbar({ onJoin }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const closeMenu = () => setIsMenuOpen(false);
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-7xl"
    >
      <div className="glass navbar-shell rounded-[30px] px-5 sm:px-7 lg:px-10 min-h-20 lg:h-24 flex items-center justify-between">
        {/* Logo */}

        <Link href="/" className="flex items-center">
          <div className="relative h-15 w-[190px] sm:h-20 sm:w-[240px] lg:w-[280px] overflow-hidden">
            <Image
              src="/images/atb-logo-Photoroom.png"
              alt="ATB"
              fill
              priority
              className="
                object-contain
                object-left
                scale-[1.18]
                origin-left
                select-none
                pointer-events-none
              "
            />
          </div>
        </Link>

        {/* Menu */}

        <div className="hidden lg:flex items-center gap-10">
          <Link
            href="#chairman-message"
            className="text-white/75 hover:text-white transition"
          >
            {t("About")}
          </Link>

          <Link
            href="#how-it-works"
            className="text-white/75 hover:text-white transition"
          >
            {t("How It Works")}
          </Link>

          <Link
            href="#benefits"
            className="text-white/75 hover:text-white transition"
          >
            {t("Benefits")}
          </Link>

          <Link
            href="#contact"
            className="text-white/75 hover:text-white transition"
          >
            {t("Contact")}
          </Link>
        </div>

        {/* CTA */}

        <button onClick={onJoin} className="primary-button hidden md:flex">
          {t("Become a Member")}
          <ArrowRight size={18} />
        </button>
        <button className="language-toggle hidden sm:inline-flex" onClick={() => setLanguage(language === "bn" ? "en" : "bn")} aria-label={language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}>{language === "bn" ? "EN" : "বাংলা"}</button>
        <button className="mobile-menu-button lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation" aria-expanded={isMenuOpen}>{isMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {isMenuOpen && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mobile-menu glass">
        {[['About', '#chairman-message'], ['How It Works', '#how-it-works'], ['Benefits', '#benefits'], ['Contact', '#contact']].map(([label, href]) => <Link key={href} href={href} onClick={closeMenu}>{t(label)}</Link>)}
        <button onClick={() => { closeMenu(); onJoin?.(); }} className="primary-button">{t("Become a Member")} <ArrowRight size={18}/></button>
        <button className="language-toggle mobile-language-toggle" onClick={() => setLanguage(language === "bn" ? "en" : "bn")}>{language === "bn" ? "English" : "বাংলা"}</button>
      </motion.div>}
    </motion.nav>
  );
}
