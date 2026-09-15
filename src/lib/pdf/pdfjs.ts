import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function openPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  const copy = bytes.slice();
  return pdfjs.getDocument({
    data: copy,
    cMapUrl: "/pdfjs/cmaps/",
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
    iccUrl: "/pdfjs/iccs/",
    fontExtraProperties: true,
  }).promise;
}

export type PageRenderResult = {
  canvas: HTMLCanvasElement;
  widthPt: number;
  heightPt: number;
};

export async function renderPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<PageRenderResult> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D not available in this browser");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return { canvas, widthPt: base.width, heightPt: base.height };
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      type,
      quality,
    );
  });
}

export type TextMatch = {
  page: number;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type TextItem = { str: string; transform: number[]; width: number; fontName: string };
type TextStyle = { fontFamily: string; descent?: number; fontSubstitutionLoadedName?: string };

const MEASURE_PX = 100;
const BOX_PAD_EM = 0.2;
const MIN_DESCENT_EM = 0.25;

function loadedFontFamilies(): Set<string> {
  const out = new Set<string>();
  for (const face of document.fonts) if (face.status === "loaded") out.add(face.family);
  return out;
}

function measureContext(): CanvasRenderingContext2D {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available in this browser");
  ctx.fontKerning = "none";
  return ctx;
}

function fontFor(item: TextItem, style: TextStyle | undefined, loaded: Set<string>): string {
  const generic = style?.fontFamily ?? "sans-serif";
  const face = [style?.fontSubstitutionLoadedName, item.fontName].find((n) => n && loaded.has(n));
  return face ? `"${face}", ${generic}` : generic;
}

export async function searchText(doc: PDFDocumentProxy, query: string): Promise<TextMatch[]> {
  const pdfjs = await getPdfjs();
  const matches: TextMatch[] = [];
  if (query.length === 0) return matches;
  const needle = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
  const ctx = measureContext();
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const hits: { item: TextItem; found: { index: number; text: string }[] }[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const found = [...item.str.matchAll(needle)].map((m) => ({ index: m.index, text: m[0] }));
      if (found.length > 0) hits.push({ item, found });
    }
    if (hits.length === 0) continue;

    let loaded = loadedFontFamilies();
    const styles = content.styles as Record<string, TextStyle>;
    const unloaded = hits.some(({ item }) => {
      const style = styles[item.fontName];
      return ![style?.fontSubstitutionLoadedName, item.fontName].some((n) => n && loaded.has(n));
    });
    if (unloaded) {
      // Only way to make pdf.js register the page's font faces without painting; measuring with the real face is what makes positions exact.
      await page.getOperatorList();
      await document.fonts.ready;
      loaded = loadedFontFamilies();
    }

    for (const { item, found } of hits) {
      const style = styles[item.fontName];
      const tx = pdfjs.Util.transform(viewport.transform, item.transform);
      const fontH = Math.hypot(tx[2], tx[3]);
      const itemW = item.width * viewport.scale;
      const pad = fontH * BOX_PAD_EM;
      const descent = Math.max(MIN_DESCENT_EM, Math.abs(style?.descent ?? 0) + 0.05);
      ctx.font = `${MEASURE_PX}px ${fontFor(item, style, loaded)}`;
      const whole = ctx.measureText(item.str).width;
      for (const { index, text } of found) {
        const before = ctx.measureText(item.str.slice(0, index)).width;
        const span = ctx.measureText(text).width;
        const x0 = whole > 0 ? tx[4] + itemW * (before / whole) : tx[4];
        const w = whole > 0 ? itemW * (span / whole) : itemW;
        const x = Math.min(1, Math.max(0, (x0 - pad) / viewport.width));
        matches.push({
          page: p,
          text,
          x,
          y: (tx[5] - fontH) / viewport.height,
          w: Math.max(0, Math.min(1 - x, (w + 2 * pad) / viewport.width)),
          h: (fontH * (1 + descent)) / viewport.height,
        });
      }
    }
    if (unloaded) page.cleanup();
  }
  return matches;
}

export type TextBox = { str: string; x: number; y: number; w: number; h: number };

export async function pageTextBoxes(doc: PDFDocumentProxy, pageNumber: number): Promise<TextBox[]> {
  const pdfjs = await getPdfjs();
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const boxes: TextBox[] = [];
  for (const item of content.items) {
    if (!("str" in item) || item.str.trim().length === 0) continue;
    const tx = pdfjs.Util.transform(viewport.transform, item.transform);
    const fontH = Math.hypot(tx[2], tx[3]);
    boxes.push({
      str: item.str,
      x: tx[4] / viewport.width,
      y: (tx[5] - fontH * 0.8) / viewport.height,
      w: (item.width * viewport.scale) / viewport.width,
      h: fontH / viewport.height,
    });
  }
  return boxes;
}

export async function extractAllText(doc: PDFDocumentProxy): Promise<string[]> {
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
  return out;
}
