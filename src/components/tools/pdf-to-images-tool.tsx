"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { canvasToBlob, openPdf, renderPage } from "@/lib/pdf/pdfjs";
import { stem } from "@/lib/pdf/ranges";
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

export function PdfToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const { busy, progress, error, results, run, reset } = useToolRunner();

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label="Choose a PDF to convert"
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
          <OptionRow label="Resolution">
            <select
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            >
              <option value={72}>72 DPI — screen</option>
              <option value={150}>150 DPI — sharp</option>
              <option value={300}>300 DPI — print</option>
            </select>
          </OptionRow>
          <RunButton
            busy={busy}
            onClick={() =>
              run(async (report) => {
                const bytes = await fileToBytes(file);
                const doc = await openPdf(bytes);
                const images: NamedFile[] = [];
                const base = stem(file.name);
                for (let p = 1; p <= doc.numPages; p++) {
                  const { canvas } = await renderPage(doc, p, dpi / 72);
                  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
                  images.push({
                    name: `${base}-page-${p}.jpg`,
                    bytes: new Uint8Array(await blob.arrayBuffer()),
                  });
                  canvas.width = 0;
                  canvas.height = 0;
                  report({ done: p, total: doc.numPages, label: "Rendering pages" });
                  await new Promise((r) => setTimeout(r, 0));
                }
                await doc.destroy();
                if (images.length === 1) {
                  return [{ name: images[0].name, bytes: images[0].bytes, mime: "image/jpeg" }];
                }
                const zip = await runOp<Uint8Array>("zipFiles", [images]);
                return [{ name: `${base}-images.zip`, bytes: zip, mime: "application/zip" }];
              })
            }
          >
            Convert to images
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
