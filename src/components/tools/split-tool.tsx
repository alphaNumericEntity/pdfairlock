"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { parseRanges, stem } from "@/lib/pdf/ranges";
import type { NamedFile } from "@/lib/pdf/types";
import { runOp } from "@/lib/worker/client";
import {
  ErrorNote,
  FileDrop,
  OptionRow,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"every" | "ranges">("every");
  const [ranges, setRanges] = useState("");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label="Choose a PDF to split"
        />
      )}
      {file && (
        <>
          <p className="text-sm">
            <span className="font-medium">{file.name}</span>{" "}
            <button type="button" className="text-brand underline" onClick={() => setFile(null)}>
              change
            </button>
          </p>
          <OptionRow label="Split mode">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "every" | "ranges")}
              className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            >
              <option value="every">Every page → separate PDF (zip)</option>
              <option value="ranges">Extract ranges → one PDF</option>
            </select>
          </OptionRow>
          {mode === "ranges" && (
            <OptionRow label="Pages">
              <input
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 7, 12-14"
                className="w-56 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
              />
            </OptionRow>
          )}
          <RunButton
            busy={busy}
            onClick={() =>
              run(async (report) => {
                const bytes = await fileToBytes(file);
                const base = stem(file.name);
                if (mode === "every") {
                  const parts = await runOp<NamedFile[]>("splitEveryPage", [bytes, base], report);
                  if (parts.length === 1) return [{ name: parts[0].name, bytes: parts[0].bytes }];
                  const zip = await runOp<Uint8Array>("zipFiles", [parts]);
                  return [{ name: `${base}-split.zip`, bytes: zip, mime: "application/zip" }];
                }
                const count = await runOp<number>("pageCount", [bytes]);
                const indices = parseRanges(ranges, count);
                const out = await runOp<Uint8Array>("extractPages", [bytes, indices]);
                return [{ name: `${base}-pages.pdf`, bytes: out }];
              })
            }
          >
            Split PDF
          </RunButton>
        </>
      )}
      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
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
