"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { parseRanges, stem } from "@/lib/pdf/ranges";
import { runOp } from "@/lib/worker/client";
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

export function RotateTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [delta, setDelta] = useState(90);
  const [scope, setScope] = useState<"all" | "some">("all");
  const [ranges, setRanges] = useState("");
  const { busy, progress, error, results, run, reset } = useToolRunner();
  const single = files.length === 1;

  return (
    <div className="space-y-5">
      <FileDrop
        accept="application/pdf"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label="Choose one or more PDFs to rotate"
      />
      <FileListEditor files={files} onChange={setFiles} />
      {files.length > 0 && (
        <>
          <OptionRow label="Rotate by">
            <select
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            >
              <option value={90}>90° clockwise</option>
              <option value={180}>180°</option>
              <option value={270}>90° counter-clockwise</option>
            </select>
          </OptionRow>
          {single ? (
            <OptionRow label="Which pages">
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "all" | "some")}
                className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
              >
                <option value="all">All pages</option>
                <option value="some">Specific pages</option>
              </select>
              {scope === "some" && (
                <input
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 2, 5-8"
                  className="w-40 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
                />
              )}
            </OptionRow>
          ) : (
            <p className="text-sm text-ink-soft">
              Rotating all pages of every file. To rotate specific pages, process one file at a
              time.
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
                  let indices: number[] | "all" = "all";
                  if (single && scope === "some") {
                    const count = await runOp<number>("pageCount", [bytes]);
                    indices = parseRanges(ranges, count);
                  }
                  const rotated = await runOp<Uint8Array>("rotatePages", [bytes, indices, delta]);
                  out.push({ name: `${stem(file.name)}-rotated.pdf`, bytes: rotated });
                  report({ done: i + 1, total: files.length, label: file.name });
                }
                return out;
              })
            }
          >
            Rotate {files.length > 1 ? `${files.length} PDFs` : "PDF"}
          </RunButton>
        </>
      )}
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
