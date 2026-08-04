import { join } from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeAll, describe, expect, it } from "vitest";
import { assembleFromPageImages, assembleMixed } from "@/lib/pdf/ops";
import { buildReport, bytesContainText } from "@/lib/pdf/redact";
import type { ImagePage, RedactBox } from "@/lib/pdf/types";

const SECRET = "SECRET-ALPHA-12345";
const PUBLIC_TEXT = "General terms and conditions";
const STANDARD_FONTS = join(__dirname, "../node_modules/pdfjs-dist/standard_fonts/");

type PdfjsModule = typeof import("pdfjs-dist");
let pdfjs: PdfjsModule;

beforeAll(async () => {
  const g = globalThis as Record<string, unknown>;
  g.DOMMatrix ??= DOMMatrix;
  g.Path2D ??= Path2D;
  g.ImageData ??= ImageData;
  pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as PdfjsModule;
});

async function makeFixture(opts?: { secretOnPage2?: boolean }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Contract containing ${SECRET}`);
  doc.setAuthor("Jane Counsel");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.addPage([595, 842]);
  p1.drawText("Employment Contract", { x: 60, y: 780, size: 24, font });
  p1.drawText(`Employee SSN: ${SECRET}`, { x: 60, y: 720, size: 14, font });
  const p2 = doc.addPage([595, 842]);
  p2.drawText(PUBLIC_TEXT, { x: 60, y: 780, size: 14, font });
  if (opts?.secretOnPage2) {
    p2.drawText(`Copy for records: ${SECRET}`, { x: 60, y: 700, size: 12, font });
  }
  return doc.save();
}

async function extractPageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await pdfjs.getDocument({
    data: bytes.slice(),
    standardFontDataUrl: STANDARD_FONTS,
  }).promise;
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out.push(
      content.items
        .map((i) => ("str" in i ? i.str : ""))
        .join(" ")
        .trim(),
    );
  }
  await doc.destroy();
  return out;
}

async function renderBurned(
  bytes: Uint8Array,
  pageNumber: number,
  boxes: RedactBox[],
): Promise<ImagePage> {
  const doc = await pdfjs.getDocument({
    data: bytes.slice(),
    standardFontDataUrl: STANDARD_FONTS,
  }).promise;
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport,
    canvas: canvas as unknown as HTMLCanvasElement,
  }).promise;
  ctx.fillStyle = "#000000";
  for (const b of boxes.filter((b) => b.page === pageNumber)) {
    ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height);
  }
  const image: ImagePage = {
    bytes: new Uint8Array(canvas.encodeSync("jpeg", 85)),
    format: "jpeg",
    widthPt: base.width,
    heightPt: base.height,
  };
  await doc.destroy();
  return image;
}

const PAGE1_BOX: RedactBox[] = [{ page: 1, x: 0.05, y: 0.08, w: 0.9, h: 0.12 }];

describe("redaction pipeline (headless corpus seed)", () => {
  it("control: the detectors find a planted secret", async () => {
    const input = await makeFixture();
    expect((await extractPageTexts(input)).join(" ")).toContain(SECRET);
    const planted = new Uint8Array([0, 1, 2, ...new TextEncoder().encode(SECRET), 3, 4]);
    expect(bytesContainText(planted, SECRET)).toBe(true);
    expect(bytesContainText(planted, "not-present")).toBe(false);
  });

  it("mixed mode: destroys text on the redacted page, keeps it elsewhere", async () => {
    const input = await makeFixture();
    const image = await renderBurned(input, 1, PAGE1_BOX);
    const output = await assembleMixed(input, [{ pageIndex: 0, image }]);

    const pageTexts = await extractPageTexts(output);
    expect(pageTexts[0]).toBe("");
    expect(pageTexts[1]).toContain(PUBLIC_TEXT);
    expect(pageTexts.join(" ")).not.toContain(SECRET);
    expect(bytesContainText(output, SECRET)).toBe(false);

    const reopened = await PDFDocument.load(output);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getTitle() ?? "").toBe("");
    expect(Math.abs(reopened.getPage(0).getWidth() - 595)).toBeLessThan(1);
    expect(Math.abs(reopened.getPage(0).getHeight() - 842)).toBeLessThan(1);

    const report = buildReport({
      mode: "mixed",
      pageTexts,
      outputBytes: output,
      redactedPages: [1],
      terms: [SECRET],
    });
    expect(report.ok).toBe(true);
  });

  it("flatten mode: destroys the text layer everywhere", async () => {
    const input = await makeFixture();
    const pages = [await renderBurned(input, 1, PAGE1_BOX), await renderBurned(input, 2, [])];
    const output = await assembleFromPageImages(pages, { stripMetadata: true });
    const pageTexts = await extractPageTexts(output);
    expect(pageTexts.every((t) => t === "")).toBe(true);
    expect(bytesContainText(output, SECRET)).toBe(false);
  });

  it("verifier catches a term the user left unredacted on another page", async () => {
    const input = await makeFixture({ secretOnPage2: true });
    const image = await renderBurned(input, 1, PAGE1_BOX);
    const output = await assembleMixed(input, [{ pageIndex: 0, image }]);
    const pageTexts = await extractPageTexts(output);

    const report = buildReport({
      mode: "mixed",
      pageTexts,
      outputBytes: output,
      redactedPages: [1],
      terms: [SECRET],
    });
    expect(report.ok).toBe(false);
    expect(report.termHitsByPage[SECRET]).toEqual([2]);
  });

  it("negative control: an untouched resave does NOT destroy the secret", async () => {
    const input = await makeFixture();
    const doc = await PDFDocument.load(input, { updateMetadata: false });
    const resaved = await doc.save();
    expect((await extractPageTexts(resaved)).join(" ")).toContain(SECRET);
  });
});
