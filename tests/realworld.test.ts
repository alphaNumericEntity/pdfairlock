import { createCanvas } from "@napi-rs/canvas";
import { PDFArray, PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  assembleMixed,
  cleanResave,
  extractPages,
  mergePdfs,
  pageCount,
  rotatePages,
  splitEveryPage,
  watermarkPdf,
} from "@/lib/pdf/ops";
import type { ImagePage } from "@/lib/pdf/types";

function scanPage(label: string): { bytes: Uint8Array; w: number; h: number } {
  const canvas = createCanvas(1240, 1754);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f0e8";
  ctx.fillRect(0, 0, 1240, 1754);
  ctx.fillStyle = "#222";
  ctx.font = "36px sans-serif";
  for (let line = 0; line < 30; line++) {
    ctx.fillText(`${label} — scanned line ${line + 1}`, 80, 120 + line * 52);
  }
  return { bytes: new Uint8Array(canvas.encodeSync("jpeg", 80)), w: 1240, h: 1754 };
}

async function makeScannedPdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const scan = scanPage(`Page ${i + 1}`);
    const img = await doc.embedJpg(scan.bytes);
    const page = doc.addPage([595, 842]);
    page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
  }
  return doc.save();
}

async function makeAnnotatedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText("Visit our website", { x: 60, y: 700, size: 14, font });
  const link = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [60, 690, 200, 716],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFName.of("https://example.com").asString() },
  });
  page.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(link)]));
  doc.addPage([595, 842]).drawText("Second page", { x: 60, y: 700, size: 14, font });
  return doc.save();
}

function whiteJpeg(): ImagePage {
  const canvas = createCanvas(200, 283);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 200, 283);
  return {
    bytes: new Uint8Array(canvas.encodeSync("jpeg", 85)),
    format: "jpeg",
    widthPt: 595,
    heightPt: 842,
  };
}

describe("scanned (image-based) documents", () => {
  it("survive split, merge, rotate and resave without corruption", async () => {
    const scan = await makeScannedPdf(3);

    const parts = await splitEveryPage(scan, "scan");
    expect(parts).toHaveLength(3);
    for (const part of parts) expect(await pageCount(part.bytes)).toBe(1);

    const merged = await mergePdfs([
      { name: "a.pdf", bytes: scan },
      { name: "b.pdf", bytes: parts[0].bytes },
    ]);
    expect(await pageCount(merged)).toBe(4);

    const rotated = await rotatePages(scan, "all", 90);
    const reopened = await PDFDocument.load(rotated);
    expect(reopened.getPage(0).getRotation().angle).toBe(90);

    const cleaned = await cleanResave(scan);
    expect(await pageCount(cleaned)).toBe(3);
    expect(cleaned.length).toBeLessThan(scan.length * 1.2);
  });

  it("mixed-assembly redaction replaces a scan page and keeps the rest", async () => {
    const scan = await makeScannedPdf(2);
    const out = await assembleMixed(scan, [{ pageIndex: 0, image: whiteJpeg() }]);
    expect(await pageCount(out)).toBe(2);
    const reopened = await PDFDocument.load(out);
    expect(Math.abs(reopened.getPage(0).getWidth() - 595)).toBeLessThan(1);
  });
});

describe("large documents", () => {
  it("handles a 120-page document through the heavy ops in reasonable time", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 120; i++) {
      doc.addPage([595, 842]).drawText(`Section ${i + 1}`, { x: 60, y: 790, size: 16, font });
    }
    const big = await doc.save();

    const started = Date.now();
    const merged = await mergePdfs([
      { name: "a.pdf", bytes: big },
      { name: "b.pdf", bytes: big },
    ]);
    expect(await pageCount(merged)).toBe(240);

    const extracted = await extractPages(big, [0, 59, 119]);
    expect(await pageCount(extracted)).toBe(3);

    const watermarked = await watermarkPdf(big, {
      text: "DRAFT",
      fontSize: 60,
      opacity: 0.25,
      rotate: 40,
      color: "gray",
    });
    expect(await pageCount(watermarked)).toBe(120);
    expect(Date.now() - started).toBeLessThan(15_000);
  });
});

describe("documents with annotations", () => {
  it("assembleMixed preserves link annotations on untouched pages", async () => {
    const annotated = await makeAnnotatedPdf();
    const out = await assembleMixed(annotated, [{ pageIndex: 1, image: whiteJpeg() }]);
    const reopened = await PDFDocument.load(out);
    const annots = reopened.getPage(0).node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    expect(annots).toBeTruthy();
  });

  it("a redacted (replaced) page carries no annotations from the original", async () => {
    const annotated = await makeAnnotatedPdf();
    const out = await assembleMixed(annotated, [{ pageIndex: 0, image: whiteJpeg() }]);
    const reopened = await PDFDocument.load(out);
    const annots = reopened.getPage(0).node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    expect(annots?.size() ?? 0).toBe(0);
  });
});
