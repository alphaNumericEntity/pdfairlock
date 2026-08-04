"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { parseRanges, stem } from "@/lib/pdf/ranges";
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

export function PagesTool({ mode }: { mode: "extract" | "delete" }) {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("");
  const { busy, progress, error, results, run, reset } = useToolRunner();
  const verb = mode === "extract" ? "Extract" : "Delete";

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label={`Choose a PDF to ${mode} pages from`}
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
          <OptionRow label={`Pages to ${mode}`}>
            <input
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 7, 12-14"
              className="w-56 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            />
          </OptionRow>
          <RunButton
            busy={busy}
            disabled={ranges.trim().length === 0}
            onClick={() =>
              run(async () => {
                const bytes = await fileToBytes(file);
                const count = await runOp<number>("pageCount", [bytes]);
                const indices = parseRanges(ranges, count);
                const op = mode === "extract" ? "extractPages" : "deletePages";
                const out = await runOp<Uint8Array>(op, [bytes, indices]);
                return [{ name: `${stem(file.name)}-${mode}ed.pdf`, bytes: out }];
              })
            }
          >
            {verb} pages
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
