"use client";

import { ExternalLink, Landmark, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CONTACT, PARTNER, whatsappLink } from "@/lib/data";
import { Kicker, Reveal, WhatsAppIcon, buttonStyles } from "./ui";

/** Stylised hologram map: street grid, Avenue Al Hosaima highlighted, pulsing pin. */
function HoloMap() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-void">
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <pattern id="blocks" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0v40" fill="none" stroke="oklch(0.89 0.15 197 / 0.12)" strokeWidth="1" />
          </pattern>
          <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#050814" stopOpacity="0" />
            <stop offset="1" stopColor="#050814" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#blocks)" />
        <path d="M-10 210 C 90 190, 160 170, 230 150 S 360 110, 420 90" stroke="#00f3ff" strokeWidth="5" fill="none" strokeOpacity=".75" />
        <path d="M120 -10 L 170 310" stroke="oklch(0.89 0.15 197 / .35)" strokeWidth="3" />
        <path d="M300 -10 L 260 310" stroke="oklch(0.89 0.15 197 / .25)" strokeWidth="2" />
        <path d="M-10 60 L 410 40" stroke="oklch(0.89 0.15 197 / .2)" strokeWidth="2" />
        <rect width="400" height="300" fill="url(#fade)" />
      </svg>
      <div className="absolute start-[56%] top-[44%] -translate-x-1/2 -translate-y-full rtl:translate-x-1/2" aria-hidden>
        <span className="pulse-ring absolute left-1/2 top-full -ms-4 -mt-4 size-8 rounded-full border-2 border-orange" />
        <MapPin className="relative size-8 fill-orange/30 text-orange drop-shadow-[0_0_10px_oklch(0.715_0.199_48/0.9)]" />
      </div>
      <span dir="ltr" className="absolute bottom-3 start-3 font-mono text-[0.7rem] tracking-widest text-cyan/80">
        AV. AL HOSAIMA · RABAT
      </span>
    </div>
  );
}

export default function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer id="contact" className="relative border-t border-line bg-void/80 pt-20 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <Kicker>{t.contact.kicker}</Kicker>
          <h2 className="mt-4 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-[1.15]">{t.contact.title}</h2>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="flex items-center gap-2 text-sm text-faint">
                <MapPin className="size-4" aria-hidden /> {t.contact.address}
              </dt>
              <dd className="mt-1 text-lg leading-relaxed">{CONTACT.address[lang]}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-faint">
                <Landmark className="size-4" aria-hidden /> {t.contact.partner}
              </dt>
              <dd className="mt-1 leading-relaxed text-mute">{PARTNER[lang]}</dd>
            </div>
          </dl>

          <ul className="mt-8 space-y-3">
            {CONTACT.phones.map((p) => (
              <li key={p.tel} className="flex flex-wrap gap-2">
                <a href={`tel:${p.tel}`} className={`${buttonStyles.ghost} min-w-[13.5rem] justify-between`}>
                  <span className="flex items-center gap-2">
                    <Phone className="size-4 text-cyan" aria-hidden />
                    {t.contact.call}
                  </span>
                  <span dir="ltr" className="font-mono">
                    {p.display}
                  </span>
                </a>
                <a
                  href={whatsappLink(t.nav.hello, p.intl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles.whatsapp}
                  aria-label={`${t.contact.whatsapp} ${p.display}`}
                >
                  <WhatsAppIcon className="size-[18px]" />
                  {t.contact.whatsapp}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
          <div className="glass hud rounded-2xl p-3">
            <HoloMap />
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-mute transition-colors hover:bg-cyan/10 hover:text-cyan"
            >
              {t.contact.map}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 text-sm text-faint sm:px-6">
        <p dir="ltr" className="font-display tracking-[0.12em]">
          BAKKOU<span className="text-cyan">·</span>TELE — AI-Tech Academy
        </p>
        <p>
          © {new Date().getFullYear()} {t.contact.rights}
        </p>
      </div>
    </footer>
  );
}
