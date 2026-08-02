import { zipSync } from "fflate";
import { degrees, PDFDocument, PDFName, rgb, StandardFonts } from "pdf-lib";
import type { ImagePage, ImagesToPdfOptions, NamedFile, WatermarkOptions } from "./types";

async function load(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    const msg = String(err instanceof Error ? err.message : err);
    if (msg.toLowerCase().includes("encrypt")) {
      throw new Error(
        "This PDF is password-protected. Remove the password first (password tools are on our roadmap).",
      );
    }
    throw new Error("Could not read this file as a PDF. It may be corrupted.");
  }
}

export async function mergePdfs(
  files: NamedFile[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  let done = 0;
  for (const file of files) {
    const src = await load(file.bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
    onProgress?.(++done, files.length);
  }
  return out.save();
}

export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await load(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  for (const p of pages) out.addPage(p);
  return out.save();
}

export async function deletePages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
  const src = await load(bytes);
  const keep = src.getPageIndices().filter((i) => !indices.includes(i));
  if (keep.length === 0) throw new Error("You can't delete every page — nothing would remain.");
  return extractPages(bytes, keep);
}

export async function splitEveryPage(bytes: Uint8Array, baseName: string): Promise<NamedFile[]> {
  const src = await load(bytes);
  const out: NamedFile[] = [];
  for (const i of src.getPageIndices()) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    out.push({ name: `${baseName}-page-${i + 1}.pdf`, bytes: await doc.save() });
  }
  return out;
}

export async function rotatePages(
  bytes: Uint8Array,
  indices: number[] | "all",
  delta: number,
): Promise<Uint8Array> {
  const doc = await load(bytes);
  const pages = doc.getPages();
  const targets = indices === "all" ? pages.map((_, i) => i) : indices;
  for (const i of targets) {
    const page = pages[i];
    if (!page) continue;
    const current = page.getRotation().angle;
    page.setRotation(degrees((((current + delta) % 360) + 360) % 360));
  }
  return doc.save();
}

export async function watermarkPdf(bytes: Uint8Array, opts: WatermarkOptions): Promise<Uint8Array> {
  const doc = await load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const color = opts.color === "red" ? rgb(0.85, 0.1, 0.1) : rgb(0.5, 0.5, 0.5);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
    page.drawText(opts.text, {
      x: width / 2 - textWidth / 2.6,
      y: height / 2 - opts.fontSize / 2,
      size: opts.fontSize,
      font,
      color,
      opacity: opts.opacity,
      rotate: degrees(opts.rotate),
    });
  }
  return doc.save();
}

export async function addPageNumbers(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const label = `${i + 1} / ${pages.length}`;
    const textWidth = font.widthOfTextAtSize(label, 10);
    page.drawText(label, {
      x: width / 2 - textWidth / 2,
      y: 24,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  });
  return doc.save();
}

export async function imagesToPdf(
  images: { bytes: Uint8Array; format: "jpeg" | "png"; pxWidth: number; pxHeight: number }[],
  opts: ImagesToPdfOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const A4: [number, number] = [595.28, 841.89];
  let done = 0;
  for (const img of images) {
    const embedded =
      img.format === "jpeg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    if (opts.pageSize === "fit") {
      const w = (img.pxWidth * 72) / 96;
      const h = (img.pxHeight * 72) / 96;
      const page = doc.addPage([w, h]);
      page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
    } else {
      const page = doc.addPage(A4);
      const maxW = A4[0] - opts.marginPt * 2;
      const maxH = A4[1] - opts.marginPt * 2;
      const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
      const w = embedded.width * scale;
      const h = embedded.height * scale;
      page.drawImage(embedded, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2, width: w, height: h });
    }
    onProgress?.(++done, images.length);
  }
  return doc.save();
}

export async function assembleFromPageImages(
  pages: ImagePage[],
  meta: { stripMetadata: boolean },
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let done = 0;
  for (const p of pages) {
    const embedded =
      p.format === "jpeg" ? await doc.embedJpg(p.bytes) : await doc.embedPng(p.bytes);
    const page = doc.addPage([p.widthPt, p.heightPt]);
    page.drawImage(embedded, { x: 0, y: 0, width: p.widthPt, height: p.heightPt });
    onProgress?.(++done, pages.length);
  }
  if (meta.stripMetadata) {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");
    doc.catalog.delete(PDFName.of("Metadata"));
  }
  return doc.save();
}

export async function cleanResave(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await load(bytes);
  return doc.save({ useObjectStreams: true });
}

export async function pageCount(bytes: Uint8Array): Promise<number> {
  const doc = await load(bytes);
  return doc.getPageCount();
}

export function zipFiles(files: NamedFile[]): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.name] = f.bytes;
  return zipSync(entries, { level: 6 });
}

export async function placeSignature(
  bytes: Uint8Array,
  sig: { png: Uint8Array; pageIndex: number; cx: number; cy: number; widthFrac: number },
): Promise<Uint8Array> {
  const doc = await load(bytes);
  const page = doc.getPages()[sig.pageIndex];
  if (!page) throw new Error("Page not found");
  const embedded = await doc.embedPng(sig.png);
  const { width: pw, height: ph } = page.getSize();
  const w = pw * sig.widthFrac;
  const h = w * (embedded.height / embedded.width);
  const x = sig.cx * pw - w / 2;
  const y = (1 - sig.cy) * ph - h / 2;
  page.drawImage(embedded, { x, y, width: w, height: h });
  return doc.save();
}
