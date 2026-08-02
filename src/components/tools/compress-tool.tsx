"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { type CompressLevel, compressLossless, compressRaster } from "@/lib/pdf/compress";
import { formatBytes, stem } from "@/lib/pdf/ranges";
import {
  ErrorNote,
  FileDrop,
  OptionRow,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

export function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressLevel | "lossless">("balanced");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label="Choose a PDF to compress"
        />
      )}
      {file && (
        <>
          <p className="text-sm">
            <span className="font-medium">{file.name}</span> ({formatBytes(file.size)}){" "}
            <button type="button" className="text-brand underline" onClick={() => setFile(null)}>
              change
            </button>
          </p>
          <OptionRow label="Level">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CompressLevel | "lossless")}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
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
                const bytes = await fileToBytes(file);
                const out =
                  level === "lossless"
                    ? await compressLossless(bytes)
                    : await compressRaster(bytes, level, report);
                return [{ name: `${stem(file.name)}-compressed.pdf`, bytes: out }];
              })
            }
          >
            Compress PDF
          </RunButton>
        </>
      )}
      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
      {results.length > 0 && file && (
        <p className="text-sm font-medium text-brand-dark">
          {formatBytes(file.size)} → {formatBytes(results[0].bytes.length)}
          {results[0].bytes.length < file.size &&
            ` — ${Math.round(((file.size - results[0].bytes.length) / file.size) * 100)}% smaller`}
        </p>
      )}
      <ResultPanel
        results={results}
        onReset={() => {
          reset();
          setFile(null);
        }}
      />
    </div>
  );
}
