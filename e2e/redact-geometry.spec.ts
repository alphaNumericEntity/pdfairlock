import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { PDFDocument, type PDFFont, StandardFonts } from "pdf-lib";

test.use({ viewport: { width: 1280, height: 1800 } });

const PAGE_W = 612;
const PAGE_H = 560;
const SIZE = 11.5;
const LEFT = 56;
const SSN = "000-00-0000";
const LINES = [
  { y: 418, text: `Social security number: ${SSN}` },
  { y: 260, text: "and must be redacted before any external release. Jane Exampleton has" },
  { y: 174, text: `Payroll reference: ${SSN} · Bank: on file · Salary band: 5` },
];

type Span = { x0: number; x1: number; yTop: number; yBottom: number };

function unkernedWidth(font: PDFFont, text: string): number {
  return [...text].reduce((acc, ch) => acc + font.widthOfTextAtSize(ch, SIZE), 0);
}

async function fixture(): Promise<{ bytes: Buffer; spans: Record<string, Span[]> }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const spans: Record<string, Span[]> = { [SSN]: [], "Jane Exampleton": [] };
  for (const line of LINES) {
    page.drawText(line.text, { x: LEFT, y: line.y, size: SIZE, font });
    for (const needle of Object.keys(spans)) {
      let idx = line.text.indexOf(needle);
      while (idx !== -1) {
        const x0 = LEFT + unkernedWidth(font, line.text.slice(0, idx));
        spans[needle].push({
          x0,
          x1: x0 + unkernedWidth(font, needle),
          yTop: PAGE_H - (line.y + SIZE * 0.72),
          yBottom: PAGE_H - line.y,
        });
        idx = line.text.indexOf(needle, idx + needle.length);
      }
    }
  }
  return { bytes: Buffer.from(await doc.save()), spans };
}

async function overlayBoxes(page: import("@playwright/test").Page) {
  return page.locator('button[title="Click to remove this box"]').evaluateAll((els) =>
    els.map((el) => {
      const s = (el as HTMLElement).style;
      const pct = (v: string) => Number.parseFloat(v) / 100;
      return { x: pct(s.left), y: pct(s.top), w: pct(s.width), h: pct(s.height) };
    }),
  );
}

test("search boxes cover the exact glyphs, including matches deep inside a line", async ({
  page,
}) => {
  const { bytes, spans } = await fixture();
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "record.pdf", mimeType: "application/pdf", buffer: bytes }]);
  await expect(page.locator("canvas").first()).toBeVisible();

  const search = page.getByPlaceholder("e.g. a name, SSN, email");
  for (const needle of Object.keys(spans)) {
    await search.fill(needle);
    await page.getByRole("button", { name: "Mark all matches" }).click();
    await expect(page.getByText(`Marked ${spans[needle].length} match`)).toBeVisible();
  }

  const boxes = await overlayBoxes(page);
  const expected = Object.values(spans).flat();
  expect(boxes).toHaveLength(expected.length);
  const slack = 0.3;
  const maxOvershoot = SIZE * 0.5;
  for (const span of expected) {
    const box = boxes
      .map((b) => ({
        x0: b.x * PAGE_W,
        x1: (b.x + b.w) * PAGE_W,
        y0: b.y * PAGE_H,
        y1: (b.y + b.h) * PAGE_H,
      }))
      .find((b) => b.y0 <= span.yTop && b.y1 >= span.yBottom && Math.abs(b.x0 - span.x0) < 30);
    expect(box, `box for glyphs at x=${span.x0.toFixed(1)}..${span.x1.toFixed(1)}`).toBeDefined();
    if (!box) return;
    expect(box.x0).toBeLessThanOrEqual(span.x0 + slack);
    expect(box.x1).toBeGreaterThanOrEqual(span.x1 - slack);
    expect(box.x0).toBeGreaterThanOrEqual(span.x0 - maxOvershoot);
    expect(box.x1).toBeLessThanOrEqual(span.x1 + maxOvershoot);
  }

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Redact .*verify/ }).click();
  await expect(page.getByText("✓ Redaction verified")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const saved = join(__dirname, "../test-results/redact-geometry-output.pdf");
  await (await downloadPromise).saveAs(saved);

  const inset = SIZE * 0.1;
  const regions = expected.map((s, i) => ({
    name: `glyphs${i}`,
    x0: (s.x0 + inset) / PAGE_W,
    x1: (s.x1 - inset) / PAGE_W,
    y0: (s.yTop + inset) / PAGE_H,
    y1: (s.yBottom - inset) / PAGE_H,
  }));
  const payroll = spans[SSN][1];
  regions.push({
    name: "afterPayrollSsn",
    x0: (payroll.x1 + SIZE) / PAGE_W,
    x1: (payroll.x1 + SIZE * 4) / PAGE_W,
    y0: (payroll.yTop + inset) / PAGE_H,
    y1: (payroll.yBottom - inset) / PAGE_H,
  });
  const raw = execFileSync(
    "node",
    [join(__dirname, "verify-output.ts"), saved, JSON.stringify(regions)],
    { encoding: "utf8" },
  );
  const verdict = JSON.parse(raw.trim().split("\n").at(-1) as string);
  expect(verdict.page1Text).toBe("");
  for (const r of regions) {
    if (r.name === "afterPayrollSsn") expect(verdict.regions[r.name]).toBeGreaterThan(150);
    else expect(verdict.regions[r.name], r.name).toBeLessThan(40);
  }
});
