"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown, Bot, Box, MousePointerClick, ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PARTNER } from "@/lib/data";
import { ButtonLink } from "./ui";

export default function HeroSection() {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);

  // Cinematic intro: words rise in, then the supporting UI. Runs again on language switch.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-word]", { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.045 })
        .from("[data-intro]", { y: 14, opacity: 0, duration: 0.7, stagger: 0.08 }, "-=0.6");
    }, root);
    return () => ctx.revert();
  }, [lang]);

  const words = t.hero.title.split(" ");

  return (
    <section
      id="hero"
      ref={root}
      className="pointer-events-none relative flex min-h-[100svh] items-end pb-14 pt-[54svh] lg:items-center lg:pb-0 lg:pt-28"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-6">
          <a
            data-intro
            href="#contact"
            className="pointer-events-auto glass group mb-6 inline-flex max-w-full items-center gap-3 rounded-full py-1.5 pe-4 ps-1.5 text-start text-[0.8rem] leading-snug shadow-[0_0_24px_-8px_oklch(0.715_0.199_48/0.7)] transition-[border-color] duration-200 hover:border-orange/60"
          >
            <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-orange/15">
              <span className="pulse-ring absolute inset-0 rounded-full border border-orange/70" />
              <span className="size-2 rounded-full bg-orange" />
            </span>
            <span className="min-w-0">
              <span className="text-mute">{t.hero.partner} </span>
              <span className="font-semibold text-ink">{PARTNER[lang]}</span>
            </span>
          </a>

          <p data-intro className="label-tech mb-4 text-[0.8rem] text-cyan">
            {t.hero.eyebrow}
          </p>

          <h1
            className={`font-display font-bold text-balance text-ink ${
              lang === "ar"
                ? "text-[clamp(2.1rem,4.4vw,4rem)] leading-[1.28]"
                : "text-[clamp(2.1rem,4.2vw,3.9rem)] leading-[1.06] tracking-[-0.02em]"
            }`}
          >
            {words.map((w, i) => (
              <span key={`${lang}-${i}`} data-word className="inline-block">
                <span className={i >= words.length - (lang === "ar" ? 2 : 3) ? "text-cyan text-glow" : undefined}>{w}</span>
                {i < words.length - 1 && " "}
              </span>
            ))}
          </h1>

          <p data-intro className="mt-5 max-w-[58ch] text-[1.05rem] leading-relaxed text-mute sm:text-lg">
            {t.hero.lead}
          </p>

          <div data-intro className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#training" variant="primary">
              <Box className="size-[18px]" aria-hidden />
              {t.hero.ctaTraining}
            </ButtonLink>
            <ButtonLink href="/diagnostics" variant="accent">
              <Bot className="size-[18px]" aria-hidden />
              {t.hero.ctaAi}
            </ButtonLink>
            <ButtonLink href="#store" variant="ghost">
              <ShoppingBag className="size-[18px]" aria-hidden />
              {t.hero.ctaStore}
            </ButtonLink>
          </div>

          <dl data-intro className="mt-10 flex max-w-lg gap-8 border-t border-line pt-5">
            {t.hero.stats.map((s) => (
              <div key={s.v} className="flex flex-col-reverse">
                <dt className="text-sm text-faint">{s.v}</dt>
                <dd className="font-display text-3xl font-bold text-ink">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div
        data-intro
        className="absolute bottom-8 end-8 hidden items-center gap-2 text-xs text-faint lg:flex"
        aria-hidden
      >
        <MousePointerClick className="size-4 text-cyan" />
        {t.hero.hint}
      </div>
      <a
        href="#training"
        aria-label={t.hero.ctaTraining}
        className="pointer-events-auto absolute bottom-6 start-1/2 hidden -translate-x-1/2 text-faint transition-colors hover:text-cyan lg:block rtl:translate-x-1/2"
      >
        <ArrowDown className="float-y size-5" aria-hidden />
      </a>
    </section>
  );
}
