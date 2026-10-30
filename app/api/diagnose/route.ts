import { runDiagnosis, type DiagInput } from "@/lib/diagnosticEngine";

export const dynamic = "force-dynamic";

const DEVICES = new Set(["phone", "laptop", "cctv"]);

function parse(body: unknown): DiagInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.device !== "string" || !DEVICES.has(b.device)) return null;
  if (!Array.isArray(b.symptoms) || b.symptoms.length === 0 || b.symptoms.length > 10) return null;
  const num = (v: unknown, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : undefined;
  return {
    device: b.device as DiagInput["device"],
    symptoms: b.symptoms.filter((s): s is string => typeof s === "string").slice(0, 10),
    current: num(b.current, 20),
    voltage: num(b.voltage, 30),
    brand: typeof b.brand === "string" ? b.brand.slice(0, 20) : undefined,
    power: b.power === "poe" || b.power === "12v" ? b.power : undefined,
    cable: num(b.cable, 2000),
    notes: typeof b.notes === "string" ? b.notes.slice(0, 500) : undefined,
    lang: b.lang === "fr" ? "fr" : "ar",
  };
}

/**
 * Streams the engine's reasoning log line by line (text/plain), then a final
 * `@@RESULT <json>` line. Delays simulate the analysis cadence.
 */
export async function POST(req: Request) {
  let input: DiagInput | null = null;
  try {
    input = parse(await req.json());
  } catch {}
  if (!input) return Response.json({ error: "invalid input" }, { status: 400 });

  const { log, result } = runDiagnosis(input);
  const enc = new TextEncoder();
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const line of log) {
          if (req.signal.aborted) break;
          controller.enqueue(enc.encode(line + "\n"));
          await sleep(180 + Math.random() * 260);
        }
        controller.enqueue(enc.encode(`@@RESULT ${JSON.stringify(result)}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
