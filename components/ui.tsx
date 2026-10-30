"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

const base =
  "press inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[0.95rem] font-semibold leading-none whitespace-nowrap select-none";

export const buttonStyles = {
  primary: `${base} bg-cyan text-void hover:bg-[oklch(0.93_0.12_197)] glow-cyan`,
  accent: `${base} bg-orange text-void hover:bg-[oklch(0.77_0.18_52)] glow-orange`,
  ghost: `${base} glass text-ink hover:border-cyan/50 hover:text-cyan`,
  whatsapp: `${base} bg-[oklch(0.72_0.17_150)] text-void hover:bg-[oklch(0.78_0.17_150)]`,
};

export function ButtonLink({
  variant = "primary",
  className = "",
  external,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles; external?: boolean }) {
  const extra = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return <Link {...props} {...extra} className={`${buttonStyles[variant]} ${className}`} />;
}

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.52-3.92-4.66-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34h.52c.17 0 .39-.06.61.47.24.56.79 1.92.86 2.06.07.14.11.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.89 1.04.93 1.92 1.22 2.19 1.35.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.59.75 1.86.88.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

export function Kicker({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "orange" }) {
  return (
    <p
      className={`label-tech inline-flex items-center gap-2 text-[0.78rem] ${
        tone === "cyan" ? "text-cyan" : "text-orange"
      }`}
    >
      <span className={`h-px w-8 ${tone === "cyan" ? "bg-cyan" : "bg-orange"}`} />
      {children}
    </p>
  );
}

/** Scroll reveal: 12px rise + fade, ease-out, once. Movement dropped under reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </Comp>
  );
}
