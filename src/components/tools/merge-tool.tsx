"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { formatBytes, stem } from "@/lib/pdf/ranges";
import { runOp } from "@/lib/worker/client";
import {
  ErrorNote,
  FileDrop,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

export function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const { busy, progress, error, results, run, reset } = useToolRunner();

  const move = (i: number, dir: -1 | 1) => {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setFiles(next);
  };

  return (
    <div className="space-y-5">
      <FileDrop
        accept="application/pdf"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label="Choose PDF files to merge"
      />
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: duplicate names allowed; items hold no state
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5"
            >
              <span className="truncate text-sm">
                {i + 1}. {f.name}{" "}
                <span className="text-xs text-ink-soft">({formatBytes(f.size)})</span>
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="rounded px-2 py-1 text-sm hover:bg-zinc-100"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="rounded px-2 py-1 text-sm hover:bg-zinc-100"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <RunButton
        busy={busy}
        disabled={files.length < 2}
        onClick={() =>
          run(async (report) => {
            const named = await Promise.all(
              files.map(async (f) => ({ name: f.name, bytes: await fileToBytes(f) })),
            );
            const bytes = await runOp<Uint8Array>("mergePdfs", [named], report);
            return [{ name: `${stem(files[0].name)}-merged.pdf`, bytes }];
          })
        }
      >
        Merge {files.length > 1 ? `${files.length} PDFs` : "PDFs"}
      </RunButton>
      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
      <ResultPanel
        results={results}
        onReset={() => {
          reset();
          setFiles([]);
        }}
      />
    </div>
  );
}
