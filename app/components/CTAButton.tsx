"use client";

import { ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

interface Props {
  children: React.ReactNode;
  secondary?: boolean;
  onClick?: () => void;
}

export default function CTAButton({ children, secondary, onClick }: Props) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      className={secondary ? "secondary-button" : "primary-button"}
    >
      {typeof children === "string" ? t(children) : children}

      {!secondary && <ArrowRight size={18} />}
    </button>
  );
}
