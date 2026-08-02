import type { Progress } from "../pdf/types";

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  onProgress?: (p: Progress) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker("/ops.worker.js");
    worker.onmessage = (e: MessageEvent) => {
      const { id, ok, result, error, progress } = e.data;
      const entry = pending.get(id);
      if (!entry) return;
      if (progress) {
        entry.onProgress?.(progress);
        return;
      }
      pending.delete(id);
      if (ok) entry.resolve(result);
      else entry.reject(new Error(error));
    };
    worker.onerror = () => {
      for (const [id, entry] of pending) {
        entry.reject(new Error("Processing failed unexpectedly. Try reloading the page."));
        pending.delete(id);
      }
      worker?.terminate();
      worker = null;
    };
  }
  return worker;
}

export function runOp<T>(
  op: string,
  args: unknown[],
  onProgress?: (p: Progress) => void,
): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
    getWorker().postMessage({ id, op, args });
  });
}
