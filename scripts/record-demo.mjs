import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const BASE = process.env.DEMO_BASE_URL ?? "https://pdfairlock.com";
const OUT = join(import.meta.dirname, "../test-results/demo");
const RAW = join(OUT, "raw");
const WIDTH = 1280;
const HEIGHT = 800;
const GIF_MAX_BYTES = 10 * 1024 * 1024;

const NAME = "Jane Exampleton";
const SSN = "000-00-0000";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeFixture() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 560]);
  const ink = rgb(0.13, 0.13, 0.15);
  const soft = rgb(0.4, 0.4, 0.45);
  const line = (text, y, opts = {}) =>
    page.drawText(text, { x: 56, y, size: 11.5, font, color: ink, ...opts });

  page.drawRectangle({ x: 0, y: 496, width: 612, height: 64, color: rgb(0.94, 0.95, 0.97) });
  line("ACME CORPORATION", 528, { font: bold, size: 16 });
  line("Employee record · Internal · Do not distribute", 510, { size: 10, color: soft });

  line("Employee", 458, { font: bold, size: 12 });
  line(`Name: ${NAME}`, 436);
  line(`Social security number: ${SSN}`, 418);
  line("Date of birth: 04 April 1980", 400);
  line("Home address: 12 Example Street, Springfield", 382);

  line("Summary", 336, { font: bold, size: 12 });
  line(`${NAME} joined the analytics team in March 2021 and currently leads the`, 314);
  line("quarterly reporting workstream. Performance reviews for 2023 and 2024 were", 296);
  line("rated 'exceeds expectations'. This record contains identifying information", 278);
  line(`and must be redacted before any external release. ${NAME} has`, 260);
  line("consented to internal processing of this file only.", 242);

  line("Payroll", 196, { font: bold, size: 12 });
  line(`Payroll reference: ${SSN} · Bank: on file · Salary band: 5`, 174);
  line("Reviewed by HR on 12 August 2025.", 156);

  line("Page 1 of 1", 70, { size: 9, color: soft });
  return Buffer.from(await doc.save());
}

const OVERLAY = () => {
  if (document.getElementById("demo-caption")) return;
  const mk = (id, styles) => {
    const el = document.createElement("div");
    el.id = id;
    Object.assign(el.style, styles);
    document.body.appendChild(el);
    return el;
  };
  mk("demo-caption", {
    position: "fixed",
    left: "50%",
    bottom: "32px",
    transform: "translateX(-50%)",
    maxWidth: "80vw",
    padding: "12px 22px",
    borderRadius: "14px",
    background: "rgba(17, 17, 20, 0.88)",
    color: "#fff",
    font: "600 22px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    opacity: "0",
    transition: "opacity 220ms ease",
    pointerEvents: "none",
    zIndex: "2147483646",
  });
  const badge = mk("demo-badge", {
    position: "fixed",
    top: "68px",
    right: "16px",
    padding: "6px 12px",
    borderRadius: "999px",
    font: "600 13px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    letterSpacing: "0.04em",
    pointerEvents: "none",
    zIndex: "2147483646",
  });
  const paint = async () => {
    let off = false;
    let why = "";
    try {
      await fetch(`/robots.txt?probe=${Date.now()}`, { cache: "no-store" });
    } catch (e) {
      off = true;
      why = e instanceof Error ? e.message : String(e);
    }
    badge.textContent = off ? `● OFFLINE · fetch(): ${why}` : "● ONLINE";
    badge.style.background = off ? "#dc2626" : "#16a34a";
    badge.style.color = "#fff";
  };
  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);

  const cursor = mk("demo-cursor", {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "26px",
    height: "26px",
    pointerEvents: "none",
    zIndex: "2147483647",
    transition: "transform 90ms ease",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
  });
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "26");
  svg.setAttribute("height", "26");
  const path = document.createElementNS(svgNs, "path");
  path.setAttribute("d", "M5 3l14 9-6 1.5L16 21l-3 1-3-7.5L5 19z");
  path.setAttribute("fill", "#111");
  path.setAttribute("stroke", "#fff");
  path.setAttribute("stroke-width", "1.5");
  path.setAttribute("stroke-linejoin", "round");
  svg.appendChild(path);
  cursor.appendChild(svg);

  const ghost = mk("demo-ghost", {
    position: "fixed",
    left: "0px",
    top: "0px",
    padding: "8px 12px",
    borderRadius: "10px",
    background: "#fff",
    border: "1px solid #d4d4d8",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    font: "500 14px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#18181b",
    whiteSpace: "nowrap",
    display: "none",
    pointerEvents: "none",
    zIndex: "2147483645",
  });
  ghost.textContent = "📄 employee-record.pdf";

  window.__demo = {
    repaint: paint,
    caption(text) {
      const el = document.getElementById("demo-caption");
      if (!text) {
        el.style.opacity = "0";
        return;
      }
      el.textContent = text;
      el.style.opacity = "1";
    },
    cursor(x, y) {
      const c = document.getElementById("demo-cursor");
      c.style.left = `${x - 4}px`;
      c.style.top = `${y - 2}px`;
      const g = document.getElementById("demo-ghost");
      g.style.left = `${x + 14}px`;
      g.style.top = `${y + 10}px`;
    },
    press(down) {
      document.getElementById("demo-cursor").style.transform = down ? "scale(0.8)" : "scale(1)";
    },
    ghost(show) {
      document.getElementById("demo-ghost").style.display = show ? "block" : "none";
    },
  };
  return paint();
};

function makeDriver(page) {
  let pos = { x: 640, y: 400 };
  const overlay = async () => {
    await page.evaluate(OVERLAY);
    await page.evaluate(([x, y]) => window.__demo.cursor(x, y), [pos.x, pos.y]);
  };
  const caption = (text) => page.evaluate((t) => window.__demo.caption(t), text);
  const moveTo = async (x, y, ms = 600) => {
    const steps = Math.max(8, Math.round(ms / 25));
    const from = { ...pos };
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const cx = from.x + (x - from.x) * e;
      const cy = from.y + (y - from.y) * e;
      await page.mouse.move(cx, cy);
      await page.evaluate(([px, py]) => window.__demo.cursor(px, py), [cx, cy]);
      await sleep(ms / steps);
    }
    pos = { x, y };
  };
  const center = async (locator) => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error("element has no box");
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const click = async (locator, ms = 600) => {
    const { x, y } = await center(locator);
    await moveTo(x, y, ms);
    await sleep(120);
    await page.evaluate(() => window.__demo.press(true));
    await page.mouse.down();
    await sleep(90);
    await page.mouse.up();
    await page.evaluate(() => window.__demo.press(false));
  };
  const scrollTo = async (locator, block = "center") => {
    await locator.evaluate((el, b) => el.scrollIntoView({ block: b, behavior: "smooth" }), block);
    await sleep(700);
  };
  return {
    overlay,
    caption,
    moveTo,
    click,
    center,
    scrollTo,
    ghost: (s) => page.evaluate((v) => window.__demo.ghost(v), s),
  };
}

async function record() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(RAW, { recursive: true });
  const fixture = await makeFixture();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: "light",
    recordVideo: { dir: RAW, size: { width: WIDTH, height: HEIGHT } },
  });

  const warm = await context.newPage();
  await warm.goto(`${BASE}/redact-pdf`);
  await warm.waitForFunction(() => navigator.serviceWorker?.controller != null, undefined, {
    timeout: 90_000,
  });
  await warm.close();

  const page = await context.newPage();
  const d = makeDriver(page);
  const started = Date.now();
  await page.goto(`${BASE}/redact-pdf`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await d.overlay();

  await d.caption("PDF tools that never upload your files");
  await d.moveTo(700, 300, 900);
  await sleep(1400);

  await d.caption("Don't believe it? Wi-Fi off.");
  await sleep(900);
  await context.setOffline(true);
  await page.evaluate(() => window.__demo.repaint());
  await sleep(1000);
  await page.reload();
  await page.getByRole("heading", { level: 1 }).waitFor();
  await context.setOffline(false);
  await context.setOffline(true);
  await d.overlay();
  await sleep(300);
  await d.caption("Still works. There is no server.");
  await sleep(1400);

  const drop = page.getByRole("button", { name: "Choose a PDF to redact" });
  const target = await d.center(drop);
  await d.moveTo(WIDTH - 60, 140, 400);
  await d.ghost(true);
  await sleep(250);
  await d.moveTo(target.x, target.y, 1100);
  const dt = await page.evaluateHandle(
    ([bytes, name]) => {
      const t = new DataTransfer();
      t.items.add(new File([new Uint8Array(bytes)], name, { type: "application/pdf" }));
      return t;
    },
    [[...fixture], "employee-record.pdf"],
  );
  await drop.dispatchEvent("dragover", { dataTransfer: dt });
  await sleep(500);
  await d.ghost(false);
  await drop.dispatchEvent("drop", { dataTransfer: dt });
  await page.waitForFunction(() => {
    const c = document.querySelector("canvas");
    return c && c.width > 300;
  });
  await sleep(1400);

  const search = page.getByPlaceholder("e.g. a name, SSN, email");
  await d.click(search, 700);
  await d.caption("Find the name and the SSN…");
  await search.pressSequentially(NAME, { delay: 55 });
  await sleep(300);
  await d.click(page.getByRole("button", { name: "Mark all matches" }), 500);
  await page.getByText(/Marked \d+ match/).waitFor();
  await d.caption("True redaction: the text is destroyed, not covered");
  await sleep(1200);
  await d.click(search, 500);
  await search.pressSequentially(SSN, { delay: 55 });
  await d.click(page.getByRole("button", { name: "Mark all matches" }), 500);
  await page.getByText(/Marked \d+ match/).waitFor();
  await sleep(1300);

  const run = page.getByRole("button", { name: /Redact .*verify/ });
  await d.scrollTo(run);
  await d.click(run, 700);
  const report = page.getByText("✓ Redaction verified");
  await report.waitFor({ timeout: 60_000 });
  await d.caption("…and it proves it: zero extractable text");
  await d.scrollTo(report.locator(".."), "center");
  await sleep(2600);

  const download = page.getByRole("button", { name: "Download", exact: true });
  await d.scrollTo(download, "end");
  const downloadPromise = page.waitForEvent("download");
  await d.click(download, 700);
  const dl = await downloadPromise;
  await dl.saveAs(join(OUT, "employee-record-redacted.pdf"));
  await d.caption("Free while in beta · pdfairlock.com");
  await sleep(3200);
  const duration = (Date.now() - started) / 1000;

  await context.setOffline(false);
  const recorded = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();

  const src = join(OUT, "demo.webm");
  renameSync(recorded, src);
  rmSync(RAW, { recursive: true, force: true });
  return { src, duration };
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(" ")}`);
}

function encode(src) {
  const mp4 = join(OUT, "demo.mp4");
  ffmpeg([
    "-i",
    src,
    "-vf",
    "fps=30,format=yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-preset",
    "slow",
    "-movflags",
    "+faststart",
    mp4,
  ]);

  const gif = join(OUT, "demo.gif");
  const palette = join(OUT, "palette.png");
  const attempts = [
    { fps: 12, width: 960 },
    { fps: 10, width: 960 },
    { fps: 10, width: 800 },
    { fps: 8, width: 800 },
  ];
  for (const { fps, width } of attempts) {
    const scale = `fps=${fps},scale=${width}:-1:flags=lanczos`;
    ffmpeg(["-i", src, "-vf", `${scale},palettegen=max_colors=192:stats_mode=diff`, palette]);
    ffmpeg([
      "-i",
      src,
      "-i",
      palette,
      "-lavfi",
      `${scale} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
      gif,
    ]);
    const size = statSync(gif).size;
    console.log(`gif ${width}px @${fps}fps = ${(size / 1024 / 1024).toFixed(2)} MB`);
    if (size <= GIF_MAX_BYTES) break;
  }
  rmSync(palette, { force: true });
  return { mp4, gif };
}

const { src, duration } = await record();
console.log(`recorded ${duration.toFixed(1)}s → ${src}`);
const { mp4, gif } = encode(src);
console.log(`mp4 ${(statSync(mp4).size / 1024 / 1024).toFixed(2)} MB → ${mp4}`);
console.log(`gif ${(statSync(gif).size / 1024 / 1024).toFixed(2)} MB → ${gif}`);
