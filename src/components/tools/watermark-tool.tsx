"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { stem } from "@/lib/pdf/ranges";
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

export function WatermarkTool({ mode }: { mode: "watermark" | "page-numbers" }) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [color, setColor] = useState<"gray" | "red">("gray");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      <FileDrop
        accept="application/pdf"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label={`Choose PDFs to ${mode === "watermark" ? "watermark" : "number"}`}
      />
      <FileListEditor files={files} onChange={setFiles} />
      {files.length > 0 && (
        <>
          {mode === "watermark" && (
            <>
              <OptionRow label="Watermark text">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-64 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
                />
              </OptionRow>
              <OptionRow label="Color">
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as "gray" | "red")}
                  className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
                >
                  <option value="gray">Gray</option>
                  <option value="red">Red</option>
                </select>
              </OptionRow>
            </>
          )}
          <RunButton
            busy={busy}
            disabled={mode === "watermark" && text.trim().length === 0}
            onClick={() =>
              run(async (report) => {
                const out = [];
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const bytes = await fileToBytes(file);
                  const processed =
                    mode === "watermark"
                      ? await runOp<Uint8Array>("watermarkPdf", [
                          bytes,
                          { text: text.trim(), fontSize: 60, opacity: 0.25, rotate: 40, color },
                        ])
                      : await runOp<Uint8Array>("addPageNumbers", [bytes]);
                  const suffix = mode === "watermark" ? "watermarked" : "numbered";
                  out.push({ name: `${stem(file.name)}-${suffix}.pdf`, bytes: processed });
                  report({ done: i + 1, total: files.length, label: file.name });
                }
                return out;
              })
            }
          >
            {mode === "watermark" ? "Add watermark" : "Add page numbers"}
            {files.length > 1 ? ` to ${files.length} PDFs` : ""}
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
