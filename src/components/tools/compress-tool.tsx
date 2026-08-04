"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { type CompressLevel, compressLossless, compressRaster } from "@/lib/pdf/compress";
import { formatBytes, stem } from "@/lib/pdf/ranges";
import {
  ErrorNote,
  FileDrop,
  FileListEditor,
  OptionRow,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

export function CompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<CompressLevel | "lossless">("balanced");
  const { busy, progress, error, results, run, reset } = useToolRunner();
  const totalIn = files.reduce((n, f) => n + f.size, 0);
  const totalOut = results.reduce((n, r) => n + r.bytes.length, 0);

  return (
    <div className="space-y-5">
      <FileDrop
        accept="application/pdf"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label="Choose one or more PDFs to compress"
      />
      <FileListEditor files={files} onChange={setFiles} />
      {files.length > 0 && (
        <>
          <OptionRow label="Level">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CompressLevel | "lossless")}
              className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            >
              <option value="strong">Strong — smallest file (96 DPI)</option>
              <option value="balanced">Balanced — great for scans (144 DPI)</option>
              <option value="light">Light — high quality (200 DPI)</option>
              <option value="lossless">Lossless — structure cleanup only</option>
            </select>
          </OptionRow>
          {level !== "lossless" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Heads up: this mode re-renders pages as images, so text will no longer be selectable
              (like a scan). Best for scanned documents. Need selectable text? Use Lossless.
            </p>
          )}
          <RunButton
            busy={busy}
            onClick={() =>
              run(async (report) => {
                const out = [];
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const bytes = await fileToBytes(file);
                  const compressed =
                    level === "lossless"
                      ? await compressLossless(bytes)
                      : await compressRaster(bytes, level, (p) =>
                          report({
                            done: i,
                            total: files.length,
                            label: `${file.name} — page ${p.done}/${p.total}`,
                          }),
                        );
                  out.push({ name: `${stem(file.name)}-compressed.pdf`, bytes: compressed });
                  report({ done: i + 1, total: files.length, label: file.name });
                }
                return out;
              })
            }
          >
            Compress {files.length > 1 ? `${files.length} PDFs` : "PDF"}
          </RunButton>
        </>
      )}
      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
      {results.length > 0 && totalIn > 0 && (
        <p className="text-sm font-medium text-brand-dark">
          {formatBytes(totalIn)} → {formatBytes(totalOut)}
          {totalOut < totalIn &&
            ` — ${Math.round(((totalIn - totalOut) / totalIn) * 100)}% smaller`}
        </p>
      )}
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
