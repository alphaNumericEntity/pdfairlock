import { readFileSync } from "node:fs";
import { join } from "node:path";

const STANDARD_FONTS = join(import.meta.dirname, "../node_modules/pdfjs-dist/standard_fonts/");
const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as typeof import("pdfjs-dist");

const bytes = new Uint8Array(readFileSync(process.argv[2]));
const doc = await pdfjs.getDocument({ data: bytes, standardFontDataUrl: STANDARD_FONTS }).promise;
const pageTexts: string[] = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  pageTexts.push(
    content.items
      .map((i) => ("str" in i ? i.str : ""))
      .join(" ")
      .trim(),
  );
}
await doc.destroy();
console.log(JSON.stringify({ pageTexts }));
