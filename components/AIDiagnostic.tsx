"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Cctv, Cpu, Laptop, Play, RotateCcw, ShoppingBag, Smartphone, TriangleAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CCTV_BRANDS, PRODUCTS, whatsappLink } from "@/lib/data";
import { SYMPTOMS, type DeviceKind, type DiagResult } from "@/lib/diagnosticEngine";
import { useDeviceTier, useReducedMotion } from "@/lib/scene";
import { Kicker, WhatsAppIcon, buttonStyles } from "./ui";

const CoreCanvas = dynamic(() => import("./three/CoreCanvas"), { ssr: false });

const DEVICE_ICONS = { phone: Smartphone, laptop: Laptop, cctv: Cctv } as const;
const DEFAULT_V: Record<DeviceKind, string> = { phone: "4.2", laptop: "19.5", cctv: "" };

const field =
  "w-full rounded-xl border border-line bg-void/70 px-3.5 py-2.5 font-mono text-ink placeholder:text-faint transition-[border-color] duration-200 focus:border-cyan focus:outline-none";
const label = "mb-2 block text-sm font-semibold text-mute";

export default function AIDiagnostic() {
  const { t, lang, dir } = useI18n();
  const tier = useDeviceTier();
  useReducedMotion();
  const [device, setDevice] = useState<DeviceKind>("phone");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [voltage, setVoltage] = useState(DEFAULT_V.phone);
  const [brand, setBrand] = useState<string>("hikvision");
  const [power, setPower] = useState<"poe" | "12v">("poe");
  const [cable, setCable] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [result, setResult] = useState<DiagResult | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [formError, setFormError] = useState("");
  const termRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight });
  }, [lines]);

  const pickDevice = (d: DeviceKind) => {
    setDevice(d);
    setSymptoms([]);
    setVoltage(DEFAULT_V[d]);
    setCurrent("");
  };
  const toggle = (id: string) => setSymptoms((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const reset = () => {
    abortRef.current?.abort();
    setLines([]);
    setResult(null);
    setStatus("idle");
  };

  async function run(e: FormEvent) {
    e.preventDefault();
    if (!symptoms.length) {
      setFormError(t.diag.needSymptom);
      return;
    }
    setFormError("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLines([]);
    setResult(null);
    setStatus("running");

    const toNum = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          device,
          symptoms,
          current: device === "cctv" ? undefined : toNum(current),
          voltage: device === "cctv" ? undefined : toNum(voltage),
          brand: device === "cctv" ? brand : undefined,
          power: device === "cctv" ? power : undefined,
          cable: device === "cctv" ? toNum(cable) : undefined,
          notes,
          lang,
        }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() ?? "";
        for (const line of parts) {
          if (line.startsWith("@@RESULT ")) setResult(JSON.parse(line.slice(9)));
          else if (line) setLines((l) => [...l, line]);
        }
      }
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
    }
  }

  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-cyan">
        <Back className="size-4" aria-hidden />
        {t.diag.back}
      </Link>

      <div className="mt-6 grid items-center gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Kicker tone="orange">Bakkou AI · /diagnostics</Kicker>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1.15] text-balance">{t.diag.title}</h1>
          <p className="mt-3 flex max-w-[60ch] items-start gap-2 text-mute">
            <TriangleAlert className="mt-1 size-4 shrink-0 text-warn" aria-hidden />
            {t.diag.lead}
          </p>
        </div>
        <div className="relative hidden h-44 lg:col-span-4 lg:block">
          {tier && tier !== "none" ? (
            <CoreCanvas />
          ) : (
            <div className="grid size-full place-items-center">
              <Cpu className="size-16 text-cyan drop-shadow-[0_0_16px_oklch(0.885_0.152_197/0.8)]" aria-hidden />
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        {/* Input console */}
        <form onSubmit={run} className="glass hud rounded-2xl p-5 sm:p-6 lg:col-span-5" noValidate>
          <fieldset>
            <legend className={label}>{t.diag.device}</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DEVICE_ICONS) as DeviceKind[]).map((d) => {
                const Icon = DEVICE_ICONS[d];
                const on = device === d;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => pickDevice(d)}
                    className={`press flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm ${
                      on ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute hover:text-ink"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                    {t.diag.devices[d]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className={label}>{t.diag.symptoms}</legend>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS[device].map((s) => {
                const on = symptoms.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(s.id)}
                    className={`press rounded-full border px-3.5 py-1.5 text-sm ${
                      on ? "border-orange bg-orange/15 text-orange" : "border-line text-mute hover:text-ink"
                    }`}
                  >
                    {s.label[lang]}
                  </button>
                );
              })}
            </div>
            {formError && (
              <p role="alert" className="mt-2 text-sm text-orange">
                {formError}
              </p>
            )}
          </fieldset>

          {device !== "cctv" ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="current" className={label}>
                  {t.diag.current}
                </label>
                <input
                  id="current"
                  inputMode="decimal"
                  dir="ltr"
                  placeholder="0.000"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className={field}
                  aria-describedby="current-hint"
                />
              </div>
              <div>
                <label htmlFor="voltage" className={label}>
                  {t.diag.voltage}
                </label>
                <input id="voltage" inputMode="decimal" dir="ltr" value={voltage} onChange={(e) => setVoltage(e.target.value)} className={field} />
              </div>
              <p id="current-hint" className="col-span-2 text-xs text-faint">
                {t.diag.currentHint}
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <fieldset>
                <legend className={label}>{t.diag.brand}</legend>
                <div className="flex flex-wrap gap-2" dir="ltr">
                  {CCTV_BRANDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={brand === b.id}
                      onClick={() => setBrand(b.id)}
                      className={`press rounded-lg border px-3 py-1.5 font-display text-sm font-semibold ${
                        brand === b.id ? "border-cyan bg-cyan/10 text-cyan" : "border-line text-mute hover:text-ink"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <fieldset>
                  <legend className={label}>{t.diag.power}</legend>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-line p-1" dir="ltr">
                    {(["poe", "12v"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={power === p}
                        onClick={() => setPower(p)}
                        className={`press rounded-lg py-1.5 font-mono text-sm ${power === p ? "bg-cyan text-void" : "text-mute"}`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="cable" className={label}>
                    {t.diag.cable}
                  </label>
                  <input id="cable" inputMode="numeric" dir="ltr" placeholder="40" value={cable} onChange={(e) => setCable(e.target.value)} className={field} />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="notes" className={label}>
              {t.diag.notes}
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.diag.notesPh}
              className={`${field} resize-none font-sans`}
              maxLength={500}
            />
          </div>

          <div className="mt-6 flex gap-2">
            <button type="submit" disabled={status === "running"} className={`${buttonStyles.accent} flex-1 disabled:opacity-60`}>
              <Play className="size-4" aria-hidden />
              {status === "running" ? t.diag.running : t.diag.run}
            </button>
            {status !== "idle" && (
              <button type="button" onClick={reset} className={buttonStyles.ghost} aria-label={t.diag.reset}>
                <RotateCcw className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </form>

        {/* Output: streaming terminal + report */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <section aria-label={t.diag.terminal} className="glass-strong hud overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className={`size-2.5 rounded-full ${status === "running" ? "animate-pulse bg-orange" : status === "done" ? "bg-ok" : "bg-faint"}`} />
              <span className="text-sm text-mute">{t.diag.terminal}</span>
              <span dir="ltr" className="ms-auto font-mono text-xs text-faint">
                tty://bakkou-ai
              </span>
            </div>
            <div
              ref={termRef}
              dir="ltr"
              aria-live="polite"
              className="relative h-72 overflow-y-auto bg-blueprint p-5 text-start font-mono text-[0.82rem] leading-relaxed"
            >
              {lines.length === 0 && status !== "running" && <p className="caret text-faint">{t.diag.idle}</p>}
              {lines.map((l, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className={`whitespace-pre-wrap ${
                    l.startsWith("[match]") || l.startsWith("[done]")
                      ? "text-ok"
                      : l.startsWith("[warn]")
                        ? "text-warn"
                        : l.startsWith("  ")
                          ? "text-orange"
                          : "text-cyan"
                  } ${status === "running" && i === lines.length - 1 ? "caret" : ""}`}
                >
                  {l}
                </motion.p>
              ))}
              {status === "error" && <p className="text-orange">{t.diag.error}</p>}
            </div>
          </section>

          <AnimatePresence>
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                aria-label={t.diag.result}
                className="glass hud rounded-2xl p-5 sm:p-6"
              >
                <Kicker>{t.diag.result}</Kicker>
                <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-balance">{result.title}</h2>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-mute">
                    <span>{t.diag.confidence}</span>
                    <span dir="ltr" className="font-mono text-cyan">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-void-3">
                    <motion.div
                      className="h-full origin-[var(--o)] rounded-full bg-gradient-to-r from-cyan to-orange rtl:bg-gradient-to-l"
                      style={{ ["--o" as string]: dir === "rtl" ? "right" : "left" }}
                      initial={{ scaleX: 0.02 }}
                      animate={{ scaleX: result.confidence }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {result.suspects.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-mute">{t.diag.suspects}</h3>
                      <ul className="mt-2 space-y-1.5">
                        {result.suspects.map((s) => (
                          <li key={s} className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-orange" aria-hidden />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={result.suspects.length ? "" : "sm:col-span-2"}>
                    <h3 className="text-sm font-semibold text-mute">{t.diag.steps}</h3>
                    <ol className="mt-2 space-y-2">
                      {result.steps.map((s, i) => (
                        <li key={i} className="flex gap-2.5 text-[0.95rem] leading-relaxed">
                          <span className="font-mono text-cyan">{String(i + 1).padStart(2, "0")}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="text-sm font-semibold text-mute">{t.diag.tools}</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                    {result.products.map((id) => {
                      const p = PRODUCTS.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <li key={id} className="flex flex-col gap-2 rounded-xl border border-line bg-void/50 p-3">
                          <span className="text-sm font-semibold leading-snug">{p.name[lang]}</span>
                          <div className="mt-auto flex gap-1.5">
                            <a
                              href={whatsappLink(`${t.store.msgOne}\n• ${p.name[lang]}\n${t.store.msgEnd}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${buttonStyles.whatsapp} flex-1 !px-2 !py-2 text-xs`}
                            >
                              <WhatsAppIcon className="size-3.5" />
                              {t.diag.order}
                            </a>
                            <Link href="/#store" className="press grid size-8 place-items-center rounded-lg border border-line text-mute hover:text-cyan" aria-label={`${t.nav.store}: ${p.name[lang]}`}>
                              <ShoppingBag className="size-4" aria-hidden />
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
