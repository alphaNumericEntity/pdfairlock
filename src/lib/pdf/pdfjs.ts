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

export async function searchText(doc: PDFDocumentProxy, query: string): Promise<TextMatch[]> {
  const pdfjs = await getPdfjs();
  const needle = query.toLowerCase();
  const matches: TextMatch[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const hay = item.str.toLowerCase();
      let from = 0;
      let idx = hay.indexOf(needle, from);
      if (idx === -1) continue;
      const tx = pdfjs.Util.transform(viewport.transform, item.transform);
      const fontH = Math.hypot(tx[2], tx[3]);
      const itemW = item.width * viewport.scale;
      while (idx !== -1) {
        const startFrac = idx / hay.length;
        const lenFrac = needle.length / hay.length;
        matches.push({
          page: p,
          text: item.str.slice(idx, idx + needle.length),
          x: (tx[4] + itemW * startFrac) / viewport.width,
          y: (tx[5] - fontH) / viewport.height,
          w: (itemW * lenFrac) / viewport.width,
          h: (fontH * 1.25) / viewport.height,
        });
        from = idx + needle.length;
        idx = hay.indexOf(needle, from);
      }
    }
  }
  return matches;
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
