"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { stem } from "@/lib/pdf/ranges";
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

export function WatermarkTool({ mode }: { mode: "watermark" | "page-numbers" }) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [color, setColor] = useState<"gray" | "red">("gray");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label={`Choose a PDF to ${mode === "watermark" ? "watermark" : "number"}`}
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
          {mode === "watermark" && (
            <>
              <OptionRow label="Watermark text">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2"
                />
              </OptionRow>
              <OptionRow label="Color">
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as "gray" | "red")}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
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
              run(async () => {
                const bytes = await fileToBytes(file);
                const out =
                  mode === "watermark"
                    ? await runOp<Uint8Array>("watermarkPdf", [
                        bytes,
                        { text: text.trim(), fontSize: 60, opacity: 0.25, rotate: 40, color },
                      ])
                    : await runOp<Uint8Array>("addPageNumbers", [bytes]);
                const suffix = mode === "watermark" ? "watermarked" : "numbered";
                return [{ name: `${stem(file.name)}-${suffix}.pdf`, bytes: out }];
              })
            }
          >
            {mode === "watermark" ? "Add watermark" : "Add page numbers"}
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
