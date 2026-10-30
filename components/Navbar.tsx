"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Languages, Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CONTACT, whatsappLink } from "@/lib/data";
import { WhatsAppIcon, buttonStyles } from "./ui";

export default function Navbar() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "/#training", label: t.nav.training },
    { href: "/diagnostics", label: t.nav.ai },
    { href: "/#store", label: t.nav.store },
    { href: "/#contact", label: t.nav.contact },
  ];

  const toggleLang = () => setLang(lang === "ar" ? "fr" : "ar");

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4 ${
          scrolled || open ? "glass-strong shadow-[0_10px_40px_-20px_oklch(0_0_0/0.8)]" : "border border-transparent"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Bakkou Tele">
          <span className="grid size-9 place-items-center rounded-lg border border-cyan/40 bg-void-2 text-cyan transition-transform duration-300 group-hover:rotate-90">
            <Cpu className="size-5" aria-hidden />
          </span>
          <span dir="ltr" className="font-display text-lg font-bold tracking-[0.12em]">
            BAKKOU<span className="text-cyan">·</span>TELE
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-[0.95rem] text-mute transition-colors duration-200 hover:bg-cyan/10 hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            className="press flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-mute hover:border-cyan/50 hover:text-ink"
            aria-label={`${lang === "ar" ? "FR" : "عربي"} — ${t.nav.switchLang}`}
          >
            <Languages className="size-4" aria-hidden />
            <span lang={lang === "ar" ? "fr" : "ar"}>{lang === "ar" ? "FR" : "عربي"}</span>
          </button>
          <a
            href={whatsappLink(t.nav.hello)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonStyles.whatsapp} !px-4 !py-2.5 max-sm:!hidden`}
          >
            <WhatsAppIcon className="size-4" />
            <span dir="ltr">{CONTACT.phones[0].display}</span>
          </a>
          <button
            type="button"
            className="press grid size-10 place-items-center rounded-lg border border-line text-ink lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.close : t.nav.menu}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: "top" }}
            className="glass-strong mx-auto mt-2 max-w-7xl rounded-2xl p-2 lg:hidden"
          >
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3.5 text-lg hover:bg-cyan/10"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={whatsappLink(t.nav.hello)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles.whatsapp} mt-2 w-full sm:!hidden`}
            >
              <WhatsAppIcon className="size-4" />
              <span dir="ltr">{CONTACT.phones[0].display}</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
