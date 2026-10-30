"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { ArrowLeft, ArrowRight, Bot } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ButtonLink, Kicker, Reveal } from "./ui";

/** Types the preview log line by line once the panel scrolls into view. */
function TypedLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(lines.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= lines.length) clearInterval(id);
    }, 520);
    return () => clearInterval(id);
  }, [inView, lines]);

  return (
    <div ref={ref} dir="ltr" className="min-h-[8.5rem] space-y-1.5 text-start font-mono text-[0.82rem] leading-relaxed sm:text-sm">
      {lines.slice(0, shown).map((l, i) => (
        <p
          key={i}
          className={`${l.startsWith(">") ? "text-mute" : l.startsWith("suggest") ? "text-orange" : "text-cyan"} ${
            i === shown - 1 ? "caret" : ""
          }`}
        >
          {l}
        </p>
      ))}
    </div>
  );
}

export default function AITeaser() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <section id="ai" className="pointer-events-none relative flex min-h-[130vh] items-center py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
        <Reveal className="pointer-events-auto lg:col-span-6 xl:col-span-5">
          <Kicker tone="orange">{t.ai.kicker}</Kicker>
          <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.15] text-balance">{t.ai.title}</h2>
          <p className="mt-4 max-w-[52ch] text-lg text-mute">{t.ai.lead}</p>

          <div className="glass-strong hud mt-8 overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-orange" />
              <span className="size-2.5 rounded-full bg-warn/80" />
              <span className="size-2.5 rounded-full bg-ok/80" />
              <span dir="ltr" className="ms-auto font-mono text-xs text-faint">
                bakkou-ai://diagnostic
              </span>
            </div>
            <div className="relative p-5">
              <div aria-hidden className="scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-cyan/5 to-transparent" />
              <TypedLog lines={t.ai.preview} />
            </div>
          </div>

          <ButtonLink href="/diagnostics" variant="accent" className="mt-7">
            <Bot className="size-[18px]" aria-hidden />
            {t.ai.cta}
            <Arrow className="size-4" aria-hidden />
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
