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

export function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [delta, setDelta] = useState(90);
  const [scope, setScope] = useState<"all" | "some">("all");
  const [ranges, setRanges] = useState("");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label="Choose a PDF to rotate"
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
          <OptionRow label="Rotate by">
            <select
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              <option value={90}>90° clockwise</option>
              <option value={180}>180°</option>
              <option value={270}>90° counter-clockwise</option>
            </select>
          </OptionRow>
          <OptionRow label="Which pages">
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "all" | "some")}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              <option value="all">All pages</option>
              <option value="some">Specific pages</option>
            </select>
            {scope === "some" && (
              <input
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 2, 5-8"
                className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2"
              />
            )}
          </OptionRow>
          <RunButton
            busy={busy}
            onClick={() =>
              run(async () => {
                const bytes = await fileToBytes(file);
                let indices: number[] | "all" = "all";
                if (scope === "some") {
                  const count = await runOp<number>("pageCount", [bytes]);
                  indices = parseRanges(ranges, count);
                }
                const out = await runOp<Uint8Array>("rotatePages", [bytes, indices, delta]);
                return [{ name: `${stem(file.name)}-rotated.pdf`, bytes: out }];
              })
            }
          >
            Rotate PDF
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
