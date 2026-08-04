import {
  addPageNumbers,
  assembleFromPageImages,
  assembleMixed,
  cleanResave,
  deletePages,
  extractPages,
  imagesToPdf,
  mergePdfs,
  pageCount,
  placeSignature,
  rotatePages,
  splitEveryPage,
  watermarkPdf,
  zipFiles,
} from "../pdf/ops";

const handlers: Record<string, (...args: never[]) => unknown> = {
  mergePdfs,
  extractPages,
  deletePages,
  splitEveryPage,
  rotatePages,
  watermarkPdf,
  addPageNumbers,
  imagesToPdf,
  assembleFromPageImages,
  assembleMixed,
  cleanResave,
  pageCount,
  zipFiles,
  placeSignature,
};

function collectTransferables(value: unknown, out: ArrayBuffer[] = []): ArrayBuffer[] {
  if (value instanceof Uint8Array) {
    if (value.buffer instanceof ArrayBuffer && !out.includes(value.buffer)) out.push(value.buffer);
    return out;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectTransferables(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectTransferables(v, out);
  }
  return out;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, op, args } = e.data as { id: number; op: string; args: unknown[] };
  const handler = handlers[op];
  if (!handler) {
    self.postMessage({ id, ok: false, error: `Unknown operation: ${op}` });
    return;
  }
  try {
    const onProgress = (done: number, total: number) =>
      self.postMessage({ id, progress: { done, total } });
    const result = await (handler as (...a: unknown[]) => unknown)(...args, onProgress);
    self.postMessage({ id, ok: true, result }, { transfer: collectTransferables(result) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
