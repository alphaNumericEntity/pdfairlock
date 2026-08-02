import { join } from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeAll, describe, expect, it } from "vitest";
import { assembleFromPageImages } from "@/lib/pdf/ops";
import { bytesContainText } from "@/lib/pdf/redact";
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

async function makeFixture(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Contract containing ${SECRET}`);
  doc.setAuthor("Jane Counsel");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.addPage([595, 842]);
  p1.drawText("Employment Contract", { x: 60, y: 780, size: 24, font });
  p1.drawText(`Employee SSN: ${SECRET}`, { x: 60, y: 720, size: 14, font });
  const p2 = doc.addPage([595, 842]);
  p2.drawText(PUBLIC_TEXT, { x: 60, y: 780, size: 14, font });
  return doc.save();
}

async function extractText(bytes: Uint8Array): Promise<string> {
  const doc = await pdfjs.getDocument({
    data: bytes.slice(),
    standardFontDataUrl: STANDARD_FONTS,
  }).promise;
  const chunks: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ("str" in item) chunks.push(item.str);
    }
  }
  await doc.destroy();
  return chunks.join(" ");
}

async function rasterizeWithBoxes(bytes: Uint8Array, boxes: RedactBox[]): Promise<Uint8Array> {
  const doc = await pdfjs.getDocument({
    data: bytes.slice(),
    standardFontDataUrl: STANDARD_FONTS,
  }).promise;
  const pages: ImagePage[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
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
    for (const b of boxes.filter((b) => b.page === p)) {
      ctx.fillRect(
        b.x * canvas.width,
        b.y * canvas.height,
        b.w * canvas.width,
        b.h * canvas.height,
      );
    }
    pages.push({
      bytes: new Uint8Array(canvas.encodeSync("jpeg", 85)),
      format: "jpeg",
      widthPt: base.width,
      heightPt: base.height,
    });
  }
  await doc.destroy();
  return assembleFromPageImages(pages, { stripMetadata: true });
}

describe("redaction pipeline (headless corpus seed)", () => {
  it("control: the detectors find a planted secret", async () => {
    const input = await makeFixture();
    expect(await extractText(input)).toContain(SECRET);
    const planted = new Uint8Array([0, 1, 2, ...new TextEncoder().encode(SECRET), 3, 4]);
    expect(bytesContainText(planted, SECRET)).toBe(true);
    expect(bytesContainText(planted, "not-present")).toBe(false);
  });

  it("rasterize + assemble destroys the text layer, the secret, and metadata", async () => {
    const input = await makeFixture();
    const boxes: RedactBox[] = [{ page: 1, x: 0.05, y: 0.08, w: 0.9, h: 0.12 }];
    const output = await rasterizeWithBoxes(input, boxes);

    expect(await extractText(output)).toBe("");
    expect(bytesContainText(output, SECRET)).toBe(false);
    expect(bytesContainText(output, "Jane Counsel")).toBe(false);

    const reopened = await PDFDocument.load(output);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getTitle() ?? "").toBe("");
    const [w, h] = [reopened.getPage(0).getWidth(), reopened.getPage(0).getHeight()];
    expect(Math.abs(w - 595)).toBeLessThan(1);
    expect(Math.abs(h - 842)).toBeLessThan(1);
  });

  it("negative control: an untouched resave does NOT destroy the secret", async () => {
    const input = await makeFixture();
    const doc = await PDFDocument.load(input, { updateMetadata: false });
    const resaved = await doc.save();
    expect(await extractText(resaved)).toContain(SECRET);
  });
});
