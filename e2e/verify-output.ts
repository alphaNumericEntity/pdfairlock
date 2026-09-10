import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDict, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

const SECRET = "SECRET-ALPHA-12345";
const STANDARD_FONTS = join(import.meta.dirname, "../node_modules/pdfjs-dist/standard_fonts/");

const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as typeof import("pdfjs-dist");

const bytes = new Uint8Array(readFileSync(process.argv[2]));

async function extractPageTexts(data: Uint8Array): Promise<string[]> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(data),
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

async function pageJpeg(data: Uint8Array, pageIndex: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data);
  const page = doc.getPage(pageIndex);
  const resources = page.node.Resources();
  const xobjects = resources?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  if (!xobjects) throw new Error("no XObject dict on page");
  for (const [, ref] of xobjects.entries()) {
    const stream = doc.context.lookup(ref);
    if (stream instanceof PDFRawStream) return stream.getContents();
  }
  throw new Error("no image stream on page");
}

async function regionMeanLuma(
  jpeg: Uint8Array,
  rect: { x0: number; y0: number; x1: number; y1: number },
): Promise<number> {
  const img = await loadImage(Buffer.from(jpeg));
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(
    Math.floor(rect.x0 * img.width),
    Math.floor(rect.y0 * img.height),
    Math.max(1, Math.floor((rect.x1 - rect.x0) * img.width)),
    Math.max(1, Math.floor((rect.y1 - rect.y0) * img.height)),
  );
  let sum = 0;
  for (let i = 0; i < px.data.length; i += 4) {
    sum += 0.299 * px.data[i] + 0.587 * px.data[i + 1] + 0.114 * px.data[i + 2];
  }
  return sum / (px.data.length / 4);
}

type NamedRegion = { name: string; x0: number; y0: number; x1: number; y1: number };

const pageTexts = await extractPageTexts(bytes);
const jpeg = await pageJpeg(bytes, 0);
const extra: NamedRegion[] = process.argv[3] ? JSON.parse(process.argv[3]) : [];
const regions: Record<string, number> = {};
for (const r of extra) regions[r.name] = await regionMeanLuma(jpeg, r);
console.log(
  JSON.stringify({
    page1Text: pageTexts[0] ?? null,
    page2Text: pageTexts[1] ?? null,
    secretAnywhere: pageTexts.join(" ").includes(SECRET),
    redactedLuma: await regionMeanLuma(jpeg, { x0: 0.31, y0: 0.133, x1: 0.45, y1: 0.143 }),
    untouchedLuma: await regionMeanLuma(jpeg, { x0: 0.11, y0: 0.055, x1: 0.4, y1: 0.07 }),
    regions,
  }),
);
