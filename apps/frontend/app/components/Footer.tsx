"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Earth, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

interface FooterProps {
  strings: {
    intro: string;
    explore: string;
    support: string;
    getInTouch: string;
    howItWorks: string;
    benefits: string;
    chairmansMessage: string;
    faqs: string;
    membershipDetails: string;
    frequentlyAskedQuestions: string;
    visitWebsite: string;
    service: string;
    footerBottom: string;
    rights: string;
    address: string;
  };
}

export default function Footer({ strings }: FooterProps) {
  return (
    <footer id="contact" className="footer-wrap">
      <div className="container-xl">
        <motion.div
          className="footer-panel glass"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="footer-main">
            <div className="footer-brand">
              <Image
                src="/images/atb-logo-Photoroom.png"
                alt="ATB Ltd"
                width={270}
                height={76}
                className="object-contain object-left"
              />
              <p>{strings.intro}</p>
              <div className="socials">
                <motion.a
                  whileHover={{ scale: 1.15 }}
                  href="https://www.facebook.com/profile.php?id=61592163080085"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow ATB Ltd on Facebook"
                >
                  <span className="facebook-mark" aria-hidden="true">
                    f
                  </span>
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.15 }}
                  href="https://atbltd.health"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit atbltd.health"
                >
                  <Earth size={18} />
                </motion.a>
              </div>
            </div>
            <div>
              <h3>{strings.explore}</h3>
              <Link href="#how-it-works">{strings.howItWorks}</Link>
              <Link href="#benefits">{strings.benefits}</Link>
              <Link href="#chairman-message">{strings.chairmansMessage}</Link>
              <Link href="#about">{strings.faqs}</Link>
            </div>
            <div>
              <h3>{strings.support}</h3>
              <Link href="#membership-details">
                {strings.membershipDetails}
              </Link>
              <Link href="#about">{strings.frequentlyAskedQuestions}</Link>
              <a href="https://atbltd.health" target="_blank" rel="noreferrer">
                {strings.visitWebsite} <ExternalLink size={14} />
              </a>
            </div>
            <address>
              <h3>{strings.getInTouch}</h3>
              <a href="mailto:info@atbltd.health">
                <Mail size={16} />
                info@atbltd.health
              </a>
              <a href="tel:+8801711993597">
                <Phone size={16} />
                01711-993597
              </a>
              <p className="footer-address">
                <MapPin size={16} />
                {strings.address}
              </p>
              <p className="footer-service-note">{strings.service}</p>
            </address>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} ATB Ltd. {strings.rights}
            </span>
            {/* <span>{strings.footerBottom}</span> */}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
