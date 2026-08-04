"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
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

async function imageDims(file: File): Promise<{ w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  const dims = { w: bitmap.width, h: bitmap.height };
  bitmap.close();
  return dims;
}

export function ImagesToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4">("fit");
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      <FileDrop
        accept="image/jpeg,image/png"
        multiple
        onFiles={(f) => setFiles((prev) => [...prev, ...f])}
        label="Choose JPG or PNG images"
      />
      <FileListEditor files={files} onChange={setFiles} />
      {files.length > 0 && (
        <OptionRow label="Page size">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as "fit" | "a4")}
            className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
          >
            <option value="fit">Match each image</option>
            <option value="a4">A4 with margins</option>
          </select>
        </OptionRow>
      )}
      <RunButton
        busy={busy}
        disabled={files.length === 0}
        onClick={() =>
          run(async (report) => {
            const images = await Promise.all(
              files.map(async (f) => {
                const dims = await imageDims(f);
                return {
                  bytes: await fileToBytes(f),
                  format: f.type === "image/png" ? ("png" as const) : ("jpeg" as const),
                  pxWidth: dims.w,
                  pxHeight: dims.h,
                };
              }),
            );
            const bytes = await runOp<Uint8Array>(
              "imagesToPdf",
              [images, { pageSize, marginPt: 36 }],
              report,
            );
            return [{ name: "images.pdf", bytes }];
          })
        }
      >
        Create PDF
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
