import { runOp } from "../worker/client";
import { canvasToBlob, openPdf, renderPage } from "./pdfjs";
import type { ImagePage, Progress } from "./types";

export type CompressLevel = "strong" | "balanced" | "light";

const LEVELS: Record<CompressLevel, { dpi: number; quality: number }> = {
  strong: { dpi: 96, quality: 0.6 },
  balanced: { dpi: 144, quality: 0.72 },
  light: { dpi: 200, quality: 0.85 },
};

export async function compressRaster(
  bytes: Uint8Array,
  level: CompressLevel,
  onProgress?: (p: Progress) => void,
): Promise<Uint8Array> {
  const { dpi, quality } = LEVELS[level];
  const doc = await openPdf(bytes);
  const pages: ImagePage[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const { canvas, widthPt, heightPt } = await renderPage(doc, p, dpi / 72);
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    pages.push({
      bytes: new Uint8Array(await blob.arrayBuffer()),
      format: "jpeg",
      widthPt,
      heightPt,
    });
    canvas.width = 0;
    canvas.height = 0;
    onProgress?.({ done: p, total: doc.numPages, label: "Recompressing pages" });
    await new Promise((r) => setTimeout(r, 0));
  }
  await doc.destroy();
  return runOp<Uint8Array>("assembleFromPageImages", [pages, { stripMetadata: false }]);
}

export async function compressLossless(bytes: Uint8Array): Promise<Uint8Array> {
  return runOp<Uint8Array>("cleanResave", [bytes]);
}
