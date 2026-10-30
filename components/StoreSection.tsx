"use client";

import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Cctv,
  Check,
  Flame,
  Layers,
  Microscope,
  Minus,
  PenTool,
  Plus,
  ShoppingCart,
  Trash2,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PRODUCTS, whatsappLink, type Product, type ProductCategory, type ProductIcon } from "@/lib/data";
import { Kicker, Reveal, WhatsAppIcon, buttonStyles } from "./ui";

const ICONS: Record<ProductIcon, LucideIcon> = {
  flame: Flame,
  pen: PenTool,
  microscope: Microscope,
  zap: Zap,
  cctv: Cctv,
  camera: Camera,
  layers: Layers,
  wrench: Wrench,
};

const FILTERS: ("all" | ProductCategory)[] = ["all", "solder", "optics", "power", "cctv"];

/** Card that tilts toward the pointer (transform only, fine pointers only). */
function TiltCard({ product, inCart, onAdd }: { product: Product; inCart: boolean; onAdd: () => void }) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const Icon = ICONS[product.icon];
  const accent = product.accent === "cyan";

  const onMove = (e: RPointerEvent) => {
    const el = ref.current;
    if (!el || reduced || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const name = product.name[lang];

  return (
    <article
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="glass group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 transition-transform duration-200 ease-[var(--ease-out-strong)] [transform-style:preserve-3d] hover:border-cyan/40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--mx,50%) var(--my,50%), ${
            accent ? "oklch(0.885 0.152 197 / 0.12)" : "oklch(0.715 0.199 48 / 0.14)"
          }, transparent 60%)`,
        }}
      />
      {/* Hologram pedestal */}
      <div className="relative mb-5 grid h-36 place-items-center overflow-hidden rounded-xl border border-line bg-void/70 bg-blueprint [transform:translateZ(30px)]">
        <div
          aria-hidden
          className={`absolute bottom-5 h-3 w-24 rounded-[50%] blur-md ${accent ? "bg-cyan/50" : "bg-orange/50"}`}
        />
        <Icon
          strokeWidth={1.25}
          aria-hidden
          className={`relative size-16 transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:-translate-y-1.5 group-hover:scale-105 ${
            accent ? "text-cyan drop-shadow-[0_0_14px_oklch(0.885_0.152_197/0.7)]" : "text-orange drop-shadow-[0_0_14px_oklch(0.715_0.199_48/0.7)]"
          }`}
        />
      </div>

      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {product.tags.map((tag) => (
          <span key={tag} className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.7rem] text-faint">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="mt-3 font-display text-lg font-bold leading-snug text-balance">{name}</h3>
      <p className="mt-1.5 flex-1 text-[0.92rem] leading-relaxed text-mute">{product.spec[lang]}</p>
      <p className="label-tech mt-4 text-xs text-faint">{t.store.price}</p>

      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <a
          href={whatsappLink(`${t.store.msgOne}\n• ${name}\n${t.store.msgEnd}`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonStyles.whatsapp} !px-3 !py-2.5 text-sm`}
        >
          <WhatsAppIcon className="size-4" />
          {t.store.orderOne}
        </a>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`${inCart ? t.store.added : t.store.add}: ${name}`}
          className={`press grid size-[42px] place-items-center rounded-xl border ${
            inCart ? "border-cyan bg-cyan/15 text-cyan" : "border-line text-ink hover:border-cyan/50"
          }`}
        >
          {inCart ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
        </button>
      </div>
    </article>
  );
}

export default function StoreSection() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  const visible = useMemo(() => PRODUCTS.filter((p) => filter === "all" || p.category === filter), [filter]);
  const items = PRODUCTS.filter((p) => cart[p.id]);
  const count = items.reduce((n, p) => n + cart[p.id], 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const setQty = (id: string, q: number) =>
    setCart((c) => {
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  const checkoutMsg = [
    t.store.msgIntro,
    ...items.map((p) => `• ${p.name[lang]} × ${cart[p.id]}`),
    t.store.msgEnd,
  ].join("\n");

  return (
    <section id="store" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-void/80 to-void/40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal className="relative max-w-2xl">
            {/* soft scrim keeps the heading legible over the 3D lab */}
            <div aria-hidden className="pointer-events-none absolute -inset-x-12 -inset-y-10 -z-10 rounded-[50%] bg-void/75 blur-2xl" />
            <Kicker>{t.store.kicker}</Kicker>
            <h2 className="mt-4 font-display text-[clamp(2rem,3.8vw,3.2rem)] font-bold leading-[1.15] text-balance">{t.store.title}</h2>
            <p className="mt-3 max-w-[52ch] text-lg text-mute">{t.store.lead}</p>
          </Reveal>
          <div role="group" aria-label={t.store.kicker} className="glass flex flex-wrap gap-1 rounded-xl p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`press rounded-lg px-3.5 py-2 text-sm ${
                  filter === f ? "bg-cyan text-void font-semibold" : "text-mute hover:text-ink"
                }`}
              >
                {t.store.filters[f]}
              </button>
            ))}
          </div>
        </div>

        <motion.ul layout className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2), ease: [0.23, 1, 0.32, 1] }}
              >
                <TiltCard product={p} inCart={!!cart[p.id]} onAdd={() => add(p.id)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      {/* Floating cart → WhatsApp checkout */}
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className={`${buttonStyles.primary} fixed bottom-5 end-5 z-40 !rounded-full !px-5 !py-3.5`}
            aria-haspopup="dialog"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {t.store.cart}
            <span className="grid min-w-6 place-items-center rounded-full bg-void px-1.5 py-0.5 text-xs text-cyan">{count}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-end bg-void/60 p-3 sm:items-stretch sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.store.cart}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              initial={{ opacity: 0, x: lang === "ar" ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === "ar" ? -24 : 24 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="glass-strong flex w-full max-w-md flex-col rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{t.store.cart}</h3>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="press grid size-9 place-items-center rounded-lg border border-line"
                  aria-label={t.nav.close}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
              <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
                {items.length === 0 && <li className="text-mute">{t.store.cartEmpty}</li>}
                {items.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <p className="flex-1 text-sm font-semibold leading-snug">{p.name[lang]}</p>
                    <div className="flex items-center gap-1" aria-label={t.store.qty}>
                      <button type="button" className="press grid size-8 place-items-center rounded-md border border-line" onClick={() => setQty(p.id, cart[p.id] - 1)} aria-label="−1">
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="w-6 text-center font-mono">{cart[p.id]}</span>
                      <button type="button" className="press grid size-8 place-items-center rounded-md border border-line" onClick={() => setQty(p.id, cart[p.id] + 1)} aria-label="+1">
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <button type="button" className="press grid size-8 place-items-center rounded-md text-faint hover:text-orange" onClick={() => setQty(p.id, 0)} aria-label={`${t.store.remove}: ${p.name[lang]}`}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(checkoutMsg)}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={items.length === 0}
                className={`${buttonStyles.whatsapp} mt-5 w-full ${items.length === 0 ? "pointer-events-none opacity-50" : ""}`}
              >
                <WhatsAppIcon className="size-[18px]" />
                {t.store.checkout}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
