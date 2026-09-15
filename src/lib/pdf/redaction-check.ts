import { openPdf, pageTextBoxes, renderPage, type TextBox } from "./pdfjs";
import { bytesContainText } from "./redact";
import type { Progress } from "./types";

export type Rect = { x: number; y: number; w: number; h: number };

export type PageCheck = {
  page: number;
  textChars: number;
  darkRects: Rect[];
  textUnderRects: string[];
  annotations: Record<string, number>;
};

export type RedactionCheck = {
  pages: PageCheck[];
  termHitsByPage: Record<string, number[]>;
  termsInBytes: string[];
  metadata: { key: string; value: string }[];
  xmpPresent: boolean;
  hasTextLayer: boolean;
  pendingRedactAnnotations: number;
  verdict: "leak" | "warn" | "clean";
};

const DARK_LUMA = 48;
const MIN_FILL = 0.85;
const MAX_PAGE_FRACTION = 0.6;
const RENDER_SCALE = 0.5;
const METADATA_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer"];

export function darkMask(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const dark = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < dark.length; i++, p += 4) {
    const luma = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (luma < DARK_LUMA && data[p + 3] > 127) dark[i] = 1;
  }
  return dark;
}

export function findDarkRects(
  dark: Uint8Array,
  width: number,
  height: number,
  minWidthPx = 10,
  minHeightPx = 5,
): Rect[] {
  const seen = new Uint8Array(width * height);
  const rects: Rect[] = [];
  const stack: number[] = [];
  for (let start = 0; start < dark.length; start++) {
    if (!dark[start] || seen[start]) continue;
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    let count = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length > 0) {
      const idx = stack.pop() as number;
      const x = idx % width;
      const y = (idx - x) / width;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const neighbours = [idx - 1, idx + 1, idx - width, idx + width];
      if (x === 0) neighbours[0] = -1;
      if (x === width - 1) neighbours[1] = -1;
      for (const n of neighbours) {
        if (n >= 0 && n < dark.length && dark[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    if (w < minWidthPx || h < minHeightPx) continue;
    if (count / (w * h) < MIN_FILL) continue;
    if ((w * h) / (width * height) > MAX_PAGE_FRACTION) continue;
    rects.push({ x: minX / width, y: minY / height, w: w / width, h: h / height });
  }
  return rects;
}

function darkFraction(
  dark: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const px0 = Math.max(0, Math.floor(x0 * width));
  const px1 = Math.min(width, Math.ceil(x1 * width));
  const py0 = Math.max(0, Math.floor(y0 * height));
  const py1 = Math.min(height, Math.ceil(y1 * height));
  const total = (px1 - px0) * (py1 - py0);
  if (total < 12) return 0;
  let count = 0;
  for (let y = py0; y < py1; y++) {
    for (let x = px0; x < px1; x++) count += dark[y * width + x];
  }
  return count / total;
}

function coveredSubstring(str: string, from: number, to: number): string {
  let start = Math.max(0, Math.floor(from * str.length));
  let end = Math.min(str.length, Math.ceil(to * str.length));
  while (start > 0 && str[start - 1] !== " ") start--;
  while (end < str.length && str[end] !== " ") end++;
  return str.slice(start, end).trim();
}

// Covered text sits on uniformly dark pixels; visible light-on-dark text leaves light glyph pixels, so it is not a leak.
export function hiddenText(
  items: TextBox[],
  rects: Rect[],
  dark: Uint8Array,
  width: number,
  height: number,
): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (item.w <= 0 || item.h <= 0) continue;
    for (const r of rects) {
      const x0 = Math.max(item.x, r.x);
      const x1 = Math.min(item.x + item.w, r.x + r.w);
      const y0 = Math.max(item.y, r.y);
      const y1 = Math.min(item.y + item.h, r.y + r.h);
      if (x1 - x0 < item.w * 0.15 || y1 - y0 < item.h * 0.5) continue;
      if (darkFraction(dark, width, height, x0, y0, x1, y1) < 0.97) continue;
      const text = coveredSubstring(item.str, (x0 - item.x) / item.w, (x1 - item.x) / item.w).slice(
        0,
        80,
      );
      if (text.length > 0) out.push(text);
    }
  }
  return [...new Set(out)];
}

export async function checkRedaction(
  bytes: Uint8Array,
  terms: string[],
  onProgress?: (p: Progress) => void,
): Promise<RedactionCheck> {
  const doc = await openPdf(bytes);
  const pages: PageCheck[] = [];
  const pageTexts: string[] = [];
  let pendingRedactAnnotations = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const boxes = await pageTextBoxes(doc, p);
    pageTexts.push(boxes.map((b) => b.str).join(" "));
    const page = await doc.getPage(p);
    const annotations: Record<string, number> = {};
    for (const a of await page.getAnnotations()) {
      const subtype = typeof a.subtype === "string" ? a.subtype : "Unknown";
      annotations[subtype] = (annotations[subtype] ?? 0) + 1;
    }
    pendingRedactAnnotations += annotations.Redact ?? 0;
    const { canvas } = await renderPage(doc, p, RENDER_SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available in this browser");
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dark = darkMask(image.data, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    const darkRects = findDarkRects(dark, image.width, image.height);
    pages.push({
      page: p,
      textChars: boxes.reduce((n, b) => n + b.str.trim().length, 0),
      darkRects,
      textUnderRects: hiddenText(boxes, darkRects, dark, image.width, image.height),
      annotations,
    });
    onProgress?.({ done: p, total: doc.numPages, label: "Inspecting pages" });
    await new Promise((r) => setTimeout(r, 0));
  }

  const cleanTerms = terms.map((t) => t.trim()).filter((t) => t.length > 0);
  const termHitsByPage: Record<string, number[]> = {};
  for (const term of cleanTerms) {
    const hits: number[] = [];
    pageTexts.forEach((text, i) => {
      if (text.toLowerCase().includes(term.toLowerCase())) hits.push(i + 1);
    });
    if (hits.length > 0) termHitsByPage[term] = hits;
  }
  const termsInBytes = cleanTerms.filter(
    (term) => !(term in termHitsByPage) && bytesContainText(bytes, term),
  );

  const { info, metadata: xmp } = await doc.getMetadata();
  const infoRecord = (info ?? {}) as Record<string, unknown>;
  const metadata = METADATA_KEYS.flatMap((key) => {
    const value = infoRecord[key];
    return typeof value === "string" && value.trim().length > 0
      ? [{ key, value: value.trim() }]
      : [];
  });
  await doc.destroy();

  const hasTextLayer = pages.some((pg) => pg.textChars > 0);
  const leak =
    pages.some((pg) => pg.textUnderRects.length > 0) ||
    Object.keys(termHitsByPage).length > 0 ||
    pendingRedactAnnotations > 0;
  const warn =
    termsInBytes.length > 0 ||
    metadata.some((m) => m.key === "Author" || m.key === "Keywords") ||
    xmp != null;
  return {
    pages,
    termHitsByPage,
    termsInBytes,
    metadata,
    xmpPresent: xmp != null,
    hasTextLayer,
    pendingRedactAnnotations,
    verdict: leak ? "leak" : warn ? "warn" : "clean",
  };
}
