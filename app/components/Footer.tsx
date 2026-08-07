"use client";

import Image from "next/image";
import Link from "next/link";
import { Earth, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer id="contact" className="footer-wrap">
      <div className="container-xl">
        <div className="footer-panel glass">
          <div className="footer-main">
            <div className="footer-brand">
              <Image
                src="/images/atb-logo-Photoroom.png"
                alt="ATB Ltd"
                width={270}
                height={76}
                className="object-contain object-left"
              />
              <p>
                {t("Healthcare support designed with care, clarity, and confidence. Customer service is available 24/7.")}
              </p>
              <div className="socials">
                <a
                  href="https://www.facebook.com/profile.php?id=61592163080085"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Follow ATB Ltd on Facebook"
                >
                  <span className="facebook-mark" aria-hidden="true">
                    f
                  </span>
                </a>
                <a
                  href="https://atbltd.health"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit atbltd.health"
                >
                  <Earth size={18} />
                </a>
              </div>
            </div>
            <div>
              <h3>{t("Explore")}</h3>
              <Link href="#how-it-works">{t("How it works")}</Link>
              <Link href="#benefits">{t("Benefits")}</Link>
              <Link href="#chairman-message">{t("Chairman’s message")}</Link>
              <Link href="#about">FAQs</Link>
            </div>
            <div>
              <h3>{t("Support")}</h3>
              <Link href="#membership-details">{t("Membership details")}</Link>
              <Link href="#about">{t("Frequently asked questions")}</Link>
              <a href="https://atbltd.health" target="_blank" rel="noreferrer">
                {t("Visit our website")} <ExternalLink size={14} />
              </a>
            </div>
            <address>
              <h3>{t("Get in touch")}</h3>
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
                Lane 08, House 02, Road 11, Sector 06, Uttara, Dhaka-1270
              </p>
              <p className="footer-service-note">
                {t("24/7 helpline & customer service")}
              </p>
            </address>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} ATB Ltd. {t("All rights reserved.")}
            </span>
            <span>{t("Healthcare, with heart.")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
