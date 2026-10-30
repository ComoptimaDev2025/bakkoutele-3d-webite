"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Cctv, Check, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CCTV_BRANDS, whatsappLink } from "@/lib/data";
import { Kicker, Reveal, WhatsAppIcon, buttonStyles } from "./ui";

function ModuleCard({
  tag,
  title,
  duration,
  icon,
  items,
  children,
  cta,
  ctaMsg,
  tone,
}: {
  tag: string;
  title: string;
  duration: string;
  icon: React.ReactNode;
  items: { t: string; d: string }[];
  children?: React.ReactNode;
  cta: string;
  ctaMsg: string;
  tone: "cyan" | "orange";
}) {
  return (
    <Reveal className="glass hud pointer-events-auto rounded-2xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <Kicker tone={tone}>{tag}</Kicker>
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
            tone === "cyan" ? "border-cyan/40 text-cyan" : "border-orange/50 text-orange"
          }`}
        >
          {icon}
        </span>
      </div>
      <h3 className="mt-3 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-tight text-balance">{title}</h3>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-mute">
        <CalendarClock className="size-4" aria-hidden />
        {duration}
      </p>
      <ul className="mt-6 space-y-3.5">
        {items.map((it) => (
          <li key={it.t} className="flex gap-3">
            <Check className={`mt-1 size-4 shrink-0 ${tone === "cyan" ? "text-cyan" : "text-orange"}`} aria-hidden />
            <p>
              <span className="font-semibold text-ink">{it.t}</span>
              <span className="text-mute"> — {it.d}</span>
            </p>
          </li>
        ))}
      </ul>
      {children}
      <a href={whatsappLink(ctaMsg)} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.whatsapp} mt-7`}>
        <WhatsAppIcon className="size-[18px]" />
        {cta}
      </a>
    </Reveal>
  );
}

function BrandTabs() {
  const { t } = useI18n();
  const [active, setActive] = useState<(typeof CCTV_BRANDS)[number]["id"]>("hikvision");
  const brand = CCTV_BRANDS.find((b) => b.id === active)!;

  return (
    <div className="mt-7 rounded-xl border border-line bg-void/50 p-4">
      <p className="mb-3 text-sm font-semibold text-mute">{t.training.moduleB.brandsTitle}</p>
      <div role="tablist" aria-label={t.training.moduleB.brandsTitle} className="flex flex-wrap gap-2" dir="ltr">
        {CCTV_BRANDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            type="button"
            aria-selected={active === b.id}
            aria-controls="brand-panel"
            onClick={() => setActive(b.id)}
            className={`press rounded-lg border px-3 py-1.5 font-display text-sm font-semibold ${
              active === b.id ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-mute hover:text-ink"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={brand.id}
          id="brand-panel"
          role="tabpanel"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-faint">{t.training.moduleB.tools}</dt>
          <dd dir="ltr" className="flex flex-wrap gap-1.5 font-mono rtl:justify-end">
            {brand.tools.map((tool) => (
              <span key={tool} className="rounded border border-cyan/25 bg-cyan/5 px-2 py-0.5 text-cyan">
                {tool}
              </span>
            ))}
          </dd>
          <dt className="text-faint">{t.training.moduleB.defaultIp}</dt>
          <dd dir="ltr" className="font-mono text-ink rtl:text-end">
            {brand.defaultIp}
          </dd>
          </dl>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function TrainingSection() {
  const { t } = useI18n();
  const A = t.training.moduleA;
  const B = t.training.moduleB;

  return (
    <section id="training" className="pointer-events-none relative">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:pt-36">
        <Reveal className="max-w-2xl">
          <Kicker>{t.training.kicker}</Kicker>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.15] text-balance">
            {t.training.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-lg text-mute">{t.training.lead}</p>
        </Reveal>
      </div>

      {/* Module A: the phone explodes while this card stays pinned */}
      <div id="module-phone" className="relative pt-[44svh] lg:min-h-[170vh] lg:pt-0">
        <div className="flex lg:sticky lg:top-0 lg:min-h-[100svh] lg:items-center lg:pt-28">
          <div className="mx-auto grid w-full max-w-7xl px-4 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-6 xl:col-span-5">
              <ModuleCard
                tag={A.tag}
                title={A.title}
                duration={A.duration}
                icon={<Smartphone className="size-5" aria-hidden />}
                items={A.items}
                cta={A.cta}
                ctaMsg={`${t.contact.registerMsg} ${A.title}`}
                tone="cyan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module B: camera flies to the CCTV dome */}
      <div id="module-cctv" className="relative pt-[44svh] lg:min-h-[150vh] lg:pt-0">
        <div className="flex lg:sticky lg:top-0 lg:min-h-[100svh] lg:items-center lg:pt-28">
          <div className="mx-auto grid w-full max-w-7xl px-4 sm:px-6 lg:grid-cols-12">
            <div className="lg:col-span-6 xl:col-span-5">
              <ModuleCard
                tag={B.tag}
                title={B.title}
                duration={B.duration}
                icon={<Cctv className="size-5" aria-hidden />}
                items={B.items}
                cta={B.cta}
                ctaMsg={`${t.contact.registerMsg} ${B.title}`}
                tone="orange"
              >
                <BrandTabs />
              </ModuleCard>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
