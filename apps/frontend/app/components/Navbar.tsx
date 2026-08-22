"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  onJoin?: () => void;
  strings: {
    about: string;
    howItWorks: string;
    benefits: string;
    contact: string;
    becomeMember: string;
    learnHowItWorks: string;
    scroll: string;
    languageToggle: string;
    login: string;
  };
  language: "en" | "bn";
  onLanguageChange: () => void;
}

export default function Navbar({
  onJoin,
  strings,
  language,
  onLanguageChange,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div
        className={`glass navbar-shell rounded-[30px] px-5 sm:px-7 lg:px-10 min-h-20 lg:h-24 flex items-center justify-between transition-all duration-500 ${
          isScrolled ? "shadow-2xl border-white/20" : ""
        }`}
      >
        {/* Logo */}

        <Link
          // href="/"
          href="/#hero"
          className="flex items-center"
          // onClick={(e) => {
          //   // If already on the homepage, scroll to top
          //   if (window.location.pathname === "/") {
          //     e.preventDefault();
          //     window.scrollTo({ top: 0, behavior: "smooth" });
          //     // Update URL to root (remove hash)
          //     history.pushState(null, "", "/");
          //   }
          // }}
        >
          <div className="relative h-15 w-[190px] sm:h-20 sm:w-[240px] lg:w-[280px] overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="ATB"
              fill
              priority
              className="
        object-contain
        object-left
        
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
            {strings.about}
          </Link>

          <Link
            href="#benefits"
            className="text-white/75 hover:text-white transition"
          >
            {strings.howItWorks}
          </Link>

          <Link
            href="#diseaseCoverage"
            className="text-white/75 hover:text-white transition"
          >
            {strings.benefits}
          </Link>

          <Link
            href="#contact"
            className="text-white/75 hover:text-white transition"
          >
            {strings.contact}
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="secondary-button whitespace-nowrap"
            style={{
              marginLeft: "32px",
              padding: "8px 16px",
              fontSize: "0.8rem",
            }}
          >
            {strings.login || "Login"}
          </Link>
          <button
            onClick={onJoin}
            className="primary-button whitespace-nowrap"
            style={{ padding: "12px 24px", fontSize: "0.9rem" }}
          >
            {strings.becomeMember}
            <ArrowRight size={18} />
          </button>
          <button
            className="language-toggle whitespace-nowrap"
            onClick={onLanguageChange}
            aria-label={
              language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"
            }
            style={{ padding: "8px 14px", minWidth: "auto" }}
          >
            {strings.languageToggle}
          </button>
        </div>

        <button
          className="mobile-menu-button lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mobile-menu glass"
        >
          {[
            ["About", "#chairman-message"],
            ["How It Works", "#how-it-works"],
            ["Benefits", "#benefits"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={closeMenu}>
              {label === "About"
                ? strings.about
                : label === "How It Works"
                  ? strings.howItWorks
                  : label === "Benefits"
                    ? strings.benefits
                    : strings.contact}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={closeMenu}
            className="secondary-button w-full text-center"
          >
            {strings.login || "Login"}
          </Link>
          <button
            onClick={() => {
              closeMenu();
              onJoin?.();
            }}
            className="primary-button"
          >
            {strings.becomeMember} <ArrowRight size={18} />
          </button>
          <button
            className="language-toggle mobile-language-toggle"
            onClick={onLanguageChange}
          >
            {language === "bn" ? "English" : "বাংলা"}
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}
