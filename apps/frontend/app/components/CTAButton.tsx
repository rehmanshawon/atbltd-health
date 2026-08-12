"use client";

import { ArrowRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
  secondary?: boolean;
  onClick?: () => void;
}

export default function CTAButton({ children, secondary, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={secondary ? "secondary-button" : "primary-button"}
    >
      {children}

      {!secondary && <ArrowRight size={18} />}
    </button>
  );
}
