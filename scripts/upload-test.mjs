import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";

const OUT = join(import.meta.dirname, "../demo-out/upload-test");
const FIXTURE_JPG = join(OUT, "fixture.jpg");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const SIGNIFICANT_BODY = 32 * 1024;
const ONLY = process.argv[2];

const SITES = [
  { name: "PDFAirlock (control)", url: "https://pdfairlock.com/merge-pdf" },
  { name: "iLovePDF", url: "https://www.ilovepdf.com/merge_pdf" },
  { name: "Smallpdf", url: "https://smallpdf.com/merge-pdf" },
  { name: "PDF24 Tools", url: "https://tools.pdf24.org/en/merge-pdf" },
  { name: "Sejda", url: "https://www.sejda.com/merge-pdf" },
  { name: "Adobe Acrobat online", url: "https://www.adobe.com/acrobat/online/merge-pdf.html" },
  { name: "PDFgear online", url: "https://www.pdfgear.com/merge-pdf/", process: /^export/i },
  { name: "PDF Candy", url: "https://pdfcandy.com/merge-pdf.html" },
  { name: "PDF2Go", url: "https://www.pdf2go.com/merge-pdf" },
  { name: "CombinePDF", url: "https://combinepdf.com/" },
  { name: "Xodo", url: "https://xodo.com/merge-pdf" },
  { name: "CleanPDF", url: "https://cleanpdf.net/merge-pdf" },
  { name: "ihatepdf", url: "https://www.ihatepdf.cv/merge-pdf" },
  { name: "LocalPDF", url: "https://localpdf.online/features/merge-pdf" },
  { name: "BentoPDF", url: "https://www.bentopdf.com/merge-pdf" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function makeFixture(label, pages) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const jpg = await doc.embedJpg(readFileSync(FIXTURE_JPG));
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(
      `Synthetic test document ${label}, page ${i} of ${pages}. Contains no real data.`,
      {
        x: 48,
        y: 750,
        size: 12,
        font,
      },
    );
    page.drawImage(jpg, { x: 48, y: 200, width: 516, height: 373 });
  }
  return Buffer.from(await doc.save());
}

function attachRecorder(page, log) {
  const record = async (req, phase) => {
    if (req.method() === "GET" || req.method() === "HEAD") return;
    let headerLen = Number(req.headers()["content-length"] ?? 0);
    try {
      headerLen = Math.max(headerLen, Number((await req.allHeaders())["content-length"] ?? 0));
    } catch {}
    const body = req.postDataBuffer();
    let sized = 0;
    try {
      sized = (await req.sizes()).requestBodySize;
    } catch {}
    log.push({
      t: Date.now(),
      phase,
      method: req.method(),
      host: new URL(req.url()).host,
      path: new URL(req.url()).pathname.slice(0, 80),
      bytes: Math.max(headerLen, body ? body.length : 0, sized),
    });
  };
  page.on("requestfinished", (req) => record(req, "finished"));
  page.on("requestfailed", (req) => record(req, "failed"));
}

async function dismissBanners(page) {
  const patterns = [
    /accept all/i,
    /accept/i,
    /agree/i,
    /allow all/i,
    /got it/i,
    /^ok$/i,
    /consent/i,
  ];
  for (const re of patterns) {
    const btn = page.getByRole("button", { name: re }).first();
    try {
      if (await btn.isVisible({ timeout: 800 })) {
        await btn.click({ timeout: 2000 });
        await sleep(500);
        return;
      }
    } catch {}
  }
}

async function findFileInput(page) {
  let input = page.locator('input[type="file"]').first();
  if ((await input.count()) > 0) return input;
  const opener = page
    .getByRole("button", { name: /select|choose|upload|browse|add file|open/i })
    .first();
  try {
    if (await opener.isVisible({ timeout: 2000 })) {
      await opener.click({ timeout: 2000 });
      await sleep(1500);
    }
  } catch {}
  input = page.locator('input[type="file"]').first();
  return (await input.count()) > 0 ? input : null;
}

async function tryProcess(page, pattern) {
  const btn = page
    .getByRole("button", {
      name: pattern ?? /^merge|combine|merge pdf|merge files|merge now|start|process|apply|join/i,
    })
    .first();
  try {
    if (await btn.isVisible({ timeout: 8000 })) await btn.click({ timeout: 3000 });
  } catch {}
}

async function visibleDownloadControls(page) {
  const controls = page.locator("a, button").filter({ hasText: /download/i });
  let visible = 0;
  for (const el of await controls.all()) {
    if (await el.isVisible().catch(() => false)) visible++;
  }
  return visible;
}

async function waitForResult(page, baseline, timeoutMs) {
  const started = Date.now();
  const download = page.waitForEvent("download", { timeout: timeoutMs }).then(
    () => "download-event",
    () => null,
  );
  const control = (async () => {
    while (Date.now() - started < timeoutMs) {
      if ((await visibleDownloadControls(page).catch(() => 0)) > baseline)
        return "download-control";
      await sleep(1000);
    }
    return null;
  })();
  return (await Promise.race([download, control])) ?? "none";
}

async function runSite(browser, site, fixtures, offline) {
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const log = [];
  attachRecorder(page, log);
  const result = { site: site.name, url: site.url, offline, note: "" };
  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(4000);
    await dismissBanners(page);
    if (offline) {
      await page
        .waitForFunction(
          () => !("serviceWorker" in navigator) || navigator.serviceWorker.controller != null,
          undefined,
          { timeout: 30000 },
        )
        .catch(() => {});
      await sleep(3000);
      log.length = 0;
      await context.setOffline(true);
    }
    const input = await findFileInput(page);
    if (!input) {
      result.note = "no file input found";
      result.outcome = "not-testable";
    } else {
      const multiple = await input.evaluate((el) => el.multiple);
      const baseline = await visibleDownloadControls(page).catch(() => 0);
      await input.setInputFiles(multiple ? fixtures : [fixtures[0]], { timeout: 10000 });
      await sleep(8000);
      await tryProcess(page, site.process);
      result.outcome = await waitForResult(page, baseline, offline ? 25000 : 45000);
    }
  } catch (err) {
    result.note = String(err.message ?? err)
      .split("\n")[0]
      .slice(0, 160);
    result.outcome = result.outcome ?? "error";
  }
  await sleep(1500);
  const uploads = log.filter((r) => r.bytes >= SIGNIFICANT_BODY);
  result.uploadedBytes = uploads.reduce((n, r) => n + r.bytes, 0);
  result.uploadHosts = [...new Set(uploads.map((r) => r.host))];
  result.uploadRequests = uploads.map((r) => ({
    host: r.host,
    path: r.path,
    bytes: r.bytes,
    phase: r.phase,
  }));
  result.requestsWithBody = log.length;
  result.title = await page.title().catch(() => "");
  result.finalUrl = page.url();
  writeFileSync(
    join(
      OUT,
      `${site.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${offline ? "offline" : "online"}-requests.json`,
    ),
    JSON.stringify(log, null, 1),
  );
  await page
    .screenshot({
      path: join(
        OUT,
        `${site.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${offline ? "offline" : "online"}.png`,
      ),
      fullPage: false,
    })
    .catch(() => {});
  await context.close();
  return result;
}

mkdirSync(OUT, { recursive: true });
const fixtures = [
  { name: "synthetic-a.pdf", mimeType: "application/pdf", buffer: await makeFixture("A", 3) },
  { name: "synthetic-b.pdf", mimeType: "application/pdf", buffer: await makeFixture("B", 2) },
];
const fixtureBytes = fixtures.reduce((n, f) => n + f.buffer.length, 0);
console.log(`fixtures: ${fixtures.map((f) => `${f.name} ${f.buffer.length}B`).join(", ")}`);

const browser = await chromium.launch({ args: ["--disable-blink-features=AutomationControlled"] });
const resultsPath = join(OUT, "results.json");
let results = [];
try {
  results = JSON.parse(readFileSync(resultsPath, "utf8"));
} catch {}
for (const site of SITES) {
  if (ONLY && !site.name.toLowerCase().includes(ONLY.toLowerCase())) continue;
  const online = await runSite(browser, site, fixtures, false);
  const offlineRun = await runSite(browser, site, fixtures, true);
  const completed = online.outcome === "download-event" || online.outcome === "download-control";
  const verdict =
    online.uploadedBytes >= fixtureBytes * 0.5
      ? "uploads"
      : online.outcome === "not-testable" || online.outcome === "error"
        ? "not-testable"
        : completed
          ? "no-upload"
          : "inconclusive";
  const row = {
    ...online,
    offlineOutcome: offlineRun.outcome,
    offlineNote: offlineRun.note,
    verdict,
    fixtureBytes,
    testedAt: new Date().toISOString(),
  };
  results = [...results.filter((r) => r.site !== site.name), row];
  console.log(
    `${site.name.padEnd(22)} ${verdict.padEnd(12)} sent=${online.uploadedBytes}B to ${online.uploadHosts.join(",") || "-"} | online=${online.outcome} | offline=${offlineRun.outcome}${online.note ? " | " + online.note : ""}`,
  );
  writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2));
}
await browser.close();
console.log(`done: ${results.length} sites, results in ${OUT}/results.json`);
