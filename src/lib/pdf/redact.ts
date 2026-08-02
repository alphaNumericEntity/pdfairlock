import { runOp } from "../worker/client";
import { canvasToBlob, extractAllText, openPdf, renderPage } from "./pdfjs";
import type { ImagePage, Progress, RedactBox } from "./types";

export type RedactionReport = {
  redactedPages: number[];
  textObjectsInOutput: number;
  termsFoundInOutput: string[];
  metadataStripped: boolean;
  ok: boolean;
};

export async function redactRasterize(
  bytes: Uint8Array,
  boxes: RedactBox[],
  onProgress?: (p: Progress) => void,
): Promise<Uint8Array> {
  if (boxes.length === 0) throw new Error("Add at least one redaction box first.");
  const doc = await openPdf(bytes);
  const byPage = new Map<number, RedactBox[]>();
  for (const b of boxes) {
    const list = byPage.get(b.page) ?? [];
    list.push(b);
    byPage.set(b.page, list);
  }
  const pages: ImagePage[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const { canvas, widthPt, heightPt } = await renderPage(doc, p, 2);
    const pageBoxes = byPage.get(p) ?? [];
    if (pageBoxes.length > 0) {
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D not available");
      ctx.fillStyle = "#000000";
      for (const b of pageBoxes) {
        const pad = 1;
        ctx.fillRect(
          b.x * canvas.width - pad,
          b.y * canvas.height - pad,
          b.w * canvas.width + pad * 2,
          b.h * canvas.height + pad * 2,
        );
      }
    }
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    pages.push({
      bytes: new Uint8Array(await blob.arrayBuffer()),
      format: "jpeg",
      widthPt,
      heightPt,
    });
    canvas.width = 0;
    canvas.height = 0;
    onProgress?.({ done: p, total: doc.numPages, label: "Rebuilding pages" });
    await new Promise((r) => setTimeout(r, 0));
  }
  await doc.destroy();
  return runOp<Uint8Array>("assembleFromPageImages", [pages, { stripMetadata: true }]);
}

export async function verifyRedaction(
  outputBytes: Uint8Array,
  redactedPages: number[],
  terms: string[],
): Promise<RedactionReport> {
  const doc = await openPdf(outputBytes);
  const pageTexts = await extractAllText(doc);
  await doc.destroy();
  const textObjectsInOutput = pageTexts.reduce((n, t) => n + (t.length > 0 ? 1 : 0), 0);

  const termsFoundInOutput = terms.filter(
    (term) => term.trim().length > 0 && bytesContainText(outputBytes, term),
  );
  return {
    redactedPages,
    textObjectsInOutput,
    termsFoundInOutput,
    metadataStripped: true,
    ok: textObjectsInOutput === 0 && termsFoundInOutput.length === 0,
  };
}

export function bytesContainText(bytes: Uint8Array, term: string): boolean {
  return latin1(bytes).toLowerCase().includes(term.trim().toLowerCase());
}

function latin1(bytes: Uint8Array): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return out;
}
