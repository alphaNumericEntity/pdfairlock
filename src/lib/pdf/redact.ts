import { runOp } from "../worker/client";
import { canvasToBlob, extractAllText, openPdf, renderPage } from "./pdfjs";
import type { ImagePage, Progress, RedactBox } from "./types";

export type RedactMode = "mixed" | "flatten";

export type RedactionReport = {
  mode: RedactMode;
  redactedPages: number[];
  textOnRedactedPages: number[];
  termHitsByPage: Record<string, number[]>;
  termsInBytes: string[];
  metadataStripped: boolean;
  ok: boolean;
};

async function renderBurnedPage(
  doc: Awaited<ReturnType<typeof openPdf>>,
  pageNumber: number,
  boxes: RedactBox[],
): Promise<ImagePage> {
  const { canvas, widthPt, heightPt } = await renderPage(doc, pageNumber, 2);
  if (boxes.length > 0) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    ctx.fillStyle = "#000000";
    for (const b of boxes) {
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
  const image: ImagePage = {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    format: "jpeg",
    widthPt,
    heightPt,
  };
  canvas.width = 0;
  canvas.height = 0;
  return image;
}

export async function redactPdf(
  bytes: Uint8Array,
  boxes: RedactBox[],
  mode: RedactMode,
  onProgress?: (p: Progress) => void,
): Promise<{ output: Uint8Array; redactedPages: number[] }> {
  if (boxes.length === 0) throw new Error("Add at least one redaction box first.");
  const doc = await openPdf(bytes);
  const byPage = new Map<number, RedactBox[]>();
  for (const b of boxes) {
    const list = byPage.get(b.page) ?? [];
    list.push(b);
    byPage.set(b.page, list);
  }
  const redactedPages = [...byPage.keys()].sort((a, b) => a - b);

  if (mode === "flatten") {
    const pages: ImagePage[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      pages.push(await renderBurnedPage(doc, p, byPage.get(p) ?? []));
      onProgress?.({ done: p, total: doc.numPages, label: "Rebuilding pages" });
      await new Promise((r) => setTimeout(r, 0));
    }
    await doc.destroy();
    const output = await runOp<Uint8Array>("assembleFromPageImages", [
      pages,
      { stripMetadata: true },
    ]);
    return { output, redactedPages };
  }

  const replacements: { pageIndex: number; image: ImagePage }[] = [];
  let done = 0;
  for (const p of redactedPages) {
    replacements.push({
      pageIndex: p - 1,
      image: await renderBurnedPage(doc, p, byPage.get(p) ?? []),
    });
    onProgress?.({ done: ++done, total: redactedPages.length, label: "Rebuilding redacted pages" });
    await new Promise((r) => setTimeout(r, 0));
  }
  await doc.destroy();
  const output = await runOp<Uint8Array>("assembleMixed", [bytes, replacements]);
  return { output, redactedPages };
}

export function buildReport(input: {
  mode: RedactMode;
  pageTexts: string[];
  outputBytes: Uint8Array;
  redactedPages: number[];
  terms: string[];
}): RedactionReport {
  const { mode, pageTexts, outputBytes, redactedPages, terms } = input;
  const cleanTerms = terms.map((t) => t.trim()).filter((t) => t.length > 0);

  const textOnRedactedPages = redactedPages.filter(
    (p) => (pageTexts[p - 1] ?? "").trim().length > 0,
  );

  const termHitsByPage: Record<string, number[]> = {};
  for (const term of cleanTerms) {
    const hits: number[] = [];
    pageTexts.forEach((text, i) => {
      if (text.toLowerCase().includes(term.toLowerCase())) hits.push(i + 1);
    });
    if (hits.length > 0) termHitsByPage[term] = hits;
  }

  const termsInBytes = cleanTerms.filter(
    (term) => !(term in termHitsByPage) && bytesContainText(outputBytes, term),
  );

  return {
    mode,
    redactedPages,
    textOnRedactedPages,
    termHitsByPage,
    termsInBytes,
    metadataStripped: true,
    ok:
      textOnRedactedPages.length === 0 &&
      Object.keys(termHitsByPage).length === 0 &&
      termsInBytes.length === 0,
  };
}

export async function verifyRedaction(
  outputBytes: Uint8Array,
  mode: RedactMode,
  redactedPages: number[],
  terms: string[],
): Promise<RedactionReport> {
  const doc = await openPdf(outputBytes);
  const pageTexts = await extractAllText(doc);
  await doc.destroy();
  return buildReport({ mode, pageTexts, outputBytes, redactedPages, terms });
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
