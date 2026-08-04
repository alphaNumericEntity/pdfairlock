"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { stem } from "@/lib/pdf/ranges";
import { runOp } from "@/lib/worker/client";
import {
  ErrorNote,
  FileDrop,
  FileListEditor,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

export function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      <FileDrop
        accept="application/pdf"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label="Choose PDF files to merge"
      />
      <FileListEditor files={files} onChange={setFiles} />
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
