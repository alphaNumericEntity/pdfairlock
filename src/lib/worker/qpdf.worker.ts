import { createQpdf } from "../pdf/qpdf-core";

const qpdf = createQpdf("/qpdf.wasm");

const handlers: Record<string, (bytes: Uint8Array, password: string) => Promise<Uint8Array>> = {
  unlock: qpdf.unlock,
  protect: qpdf.protect,
};

self.onmessage = async (e: MessageEvent) => {
  const { id, op, args } = e.data as { id: number; op: string; args: [Uint8Array, string] };
  const handler = handlers[op];
  if (!handler) {
    self.postMessage({ id, ok: false, error: `Unknown operation: ${op}` });
    return;
  }
  try {
    const result = await handler(...args);
    self.postMessage({ id, ok: true, result }, { transfer: [result.buffer as ArrayBuffer] });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
