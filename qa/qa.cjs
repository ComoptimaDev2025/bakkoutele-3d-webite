/* Visual + a11y QA: node qa/qa.cjs [baseUrl] */
const { chromium } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = [375, 768, 1440];
const STAGES = ["hero", "module-phone", "module-cctv", "ai", "store", "contact"];
const report = { console: [], failed: [], overflow: [], axe: {}, notes: [] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(page, tag) {
  page.on("console", (m) => m.type() === "error" && report.console.push(`${tag}: ${m.text()}`));
  page.on("pageerror", (e) => report.console.push(`${tag}: pageerror ${e.message}`));
  page.on("requestfailed", (r) => {
    if (!r.url().includes("wa.me")) report.failed.push(`${tag}: ${r.url()} ${r.failure()?.errorText}`);
  });
}

async function scrollToStage(page, id) {
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = id === "hero" ? 0 : top - window.innerHeight * 0.35 + (id.startsWith("module") ? window.innerHeight * 0.45 : 0);
    window.scrollTo({ top: y, behavior: "instant" });
  }, id);
}

async function overflow(page, tag) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (o > 0) report.overflow.push(`${tag}: +${o}px`);
}

(async () => {
  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });

  for (const w of WIDTHS) {
    const h = w === 375 ? 812 : w === 768 ? 1024 : 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: "dark" });
    const page = await ctx.newPage();
    watch(page, `home@${w}`);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await sleep(3500);
    for (const id of STAGES) {
      await scrollToStage(page, id);
      await sleep(id === "hero" ? 600 : 2600);
      await page.screenshot({ path: `${OUT}/home-${w}-${id}.png` });
    }
    await overflow(page, `home@${w}`);
    if (w === 1440) {
      const r = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
      report.axe.home = r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      // store cart flow
      await scrollToStage(page, "store");
      await sleep(500);
      const add = page.locator("#store article button").first();
      await add.click();
      await page.locator("#store article button").nth(2).click();
      await page.getByRole("button", { name: /طلبك|Votre commande/ }).click();
      await sleep(400);
      await page.screenshot({ path: `${OUT}/store-cart-1440.png` });
      const href = await page.locator('[role="dialog"] a').last().getAttribute("href");
      report.notes.push("checkout href: " + decodeURIComponent(href || ""));
    }
    await ctx.close();
  }

  // French / LTR
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    watch(page, "home-fr");
    await page.goto(BASE + "/?lang=fr", { waitUntil: "networkidle" });
    await sleep(3500);
    await page.screenshot({ path: `${OUT}/fr-1440-hero.png` });
    await scrollToStage(page, "module-phone");
    await sleep(2600);
    await page.screenshot({ path: `${OUT}/fr-1440-module-phone.png` });
    await overflow(page, "home-fr");
    await ctx.close();
  }

  // Hero hover/click on a component (CPU sits right of the phone centre, upper half)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    watch(page, "hero-click");
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await sleep(3500);
    const hit = await page.evaluate(async () => {
      // sweep a coarse grid until the cursor turns into a pointer (component hovered)
      return null;
    });
    let found = null;
    for (let y = 250; y < 520 && !found; y += 18) {
      for (let x = 200; x < 760 && !found; x += 18) {
        await page.mouse.move(x, y);
        await sleep(25);
        const c = await page.evaluate(() => document.body.style.cursor);
        if (c === "pointer") found = { x, y };
      }
    }
    if (found) {
      await page.mouse.click(found.x, found.y);
      await sleep(500);
      report.notes.push(`hero component hit at ${found.x},${found.y}`);
    } else report.notes.push("hero component: no pointer target found in sweep");
    await page.screenshot({ path: `${OUT}/hero-callout-1440.png` });
    await ctx.close();
  }

  // Reduced motion + light preference (site is dark-only by brand: must look identical)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", colorScheme: "light" });
    const page = await ctx.newPage();
    watch(page, "reduced");
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await sleep(2500);
    await page.screenshot({ path: `${OUT}/reduced-light-1440.png` });
    await ctx.close();
  }

  // 2D fallback
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    watch(page, "fallback");
    await page.goto(BASE + "/?2d", { waitUntil: "networkidle" });
    await sleep(1500);
    await page.screenshot({ path: `${OUT}/fallback2d-375.png` });
    await ctx.close();
  }

  // Diagnostics flow
  for (const w of [375, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 375 ? 812 : 900 } });
    const page = await ctx.newPage();
    watch(page, `diag@${w}`);
    await page.goto(BASE + "/diagnostics", { waitUntil: "networkidle" });
    await sleep(1200);
    await page.screenshot({ path: `${OUT}/diag-${w}-idle.png`, fullPage: true });
    await page.getByRole("button", { name: "لا يشتغل" }).click();
    await page.getByRole("button", { name: "ارتفاع الحرارة" }).click();
    await page.fill("#current", "1.4");
    await page.getByRole("button", { name: "تشغيل التحليل" }).click();
    await page.waitForSelector('section[aria-label="التشخيص"]', { timeout: 15000 });
    await sleep(1000);
    await page.screenshot({ path: `${OUT}/diag-${w}-result.png`, fullPage: true });
    await overflow(page, `diag@${w}`);
    if (w === 1440) {
      const r = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
      report.axe.diagnostics = r.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
      // CCTV path
      await page.getByRole("button", { name: "نظام مراقبة" }).click();
      await page.getByRole("button", { name: "الكاميرا غير مكتشفة" }).click();
      await page.getByRole("button", { name: "Dahua" }).click();
      await page.fill("#cable", "130");
      await page.getByRole("button", { name: "تشغيل التحليل" }).click();
      // wait for the stream to finish, not just for the first matching text
      await page.waitForFunction(() => document.body.innerText.includes("report ready"), null, { timeout: 15000 });
      await sleep(1200);
      await page.screenshot({ path: `${OUT}/diag-1440-cctv.png`, fullPage: true });
    }
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
