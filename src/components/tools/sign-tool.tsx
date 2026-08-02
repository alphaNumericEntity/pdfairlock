"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useRef, useState } from "react";
import { fileToBytes } from "@/lib/download";
import { openPdf, renderPage } from "@/lib/pdf/pdfjs";
import { stem } from "@/lib/pdf/ranges";
import { runOp } from "@/lib/worker/client";
import { ErrorNote, FileDrop, OptionRow, ResultPanel, RunButton, useToolRunner } from "../tool-ui";

export function SignTool() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigBytes, setSigBytes] = useState<Uint8Array | null>(null);
  const [placement, setPlacement] = useState<{ cx: number; cy: number } | null>(null);
  const [widthFrac, setWidthFrac] = useState(0.25);
  const [sigAspect, setSigAspect] = useState(0.35);

  const padRef = useRef<HTMLCanvasElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);
  const { busy, error, results, run, reset, setError } = useToolRunner();

  const showPage = async (d: PDFDocumentProxy, p: number) => {
    const target = pageCanvasRef.current;
    if (!target) return;
    const { canvas } = await renderPage(d, p, 1.5);
    target.width = canvas.width;
    target.height = canvas.height;
    target.getContext("2d")?.drawImage(canvas, 0, 0);
  };

  const onFile = async (f: File) => {
    try {
      const d = await openPdf(await fileToBytes(f));
      setFile(f);
      setDoc(d);
      setNumPages(d.numPages);
      setPageNum(1);
      setPlacement(null);
      await showPage(d, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const goToPage = async (p: number) => {
    if (!doc || p < 1 || p > numPages) return;
    setPageNum(p);
    setPlacement(null);
    await showPage(doc, p);
  };

  const padPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
      y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
    };
  };

  const captureSignature = async () => {
    const pad = padRef.current;
    if (!pad || !hasStrokes.current) return;
    const blob = await new Promise<Blob | null>((r) => pad.toBlob(r, "image/png"));
    if (!blob) return;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    setSigBytes(bytes);
    setSigAspect(pad.height / pad.width);
    setSigUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });
  };

  const clearPad = () => {
    const pad = padRef.current;
    if (!pad) return;
    pad.getContext("2d")?.clearRect(0, 0, pad.width, pad.height);
    hasStrokes.current = false;
    setSigBytes(null);
    setSigUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setPlacement(null);
  };

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => onFile(f[0])}
          label="Choose a PDF to sign"
        />
      )}

      <div className={file ? "space-y-5" : "hidden"}>
        <div className="space-y-2">
          <p className="text-sm font-medium">1. Draw your signature</p>
          <canvas
            ref={padRef}
            width={500}
            height={180}
            className="w-full max-w-lg cursor-crosshair touch-none rounded-xl border border-zinc-300 bg-white"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = true;
              hasStrokes.current = true;
              const ctx = e.currentTarget.getContext("2d");
              if (!ctx) return;
              const { x, y } = padPos(e);
              ctx.lineWidth = 3;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.strokeStyle = "#1a2b6d";
              ctx.beginPath();
              ctx.moveTo(x, y);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = e.currentTarget.getContext("2d");
              if (!ctx) return;
              const { x, y } = padPos(e);
              ctx.lineTo(x, y);
              ctx.stroke();
            }}
            onPointerUp={() => {
              drawing.current = false;
              captureSignature();
            }}
          />
          <button type="button" onClick={clearPad} className="text-sm text-brand underline">
            Clear signature
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            2. Click on the page where the signature should go
            {numPages > 1 && ` (page ${pageNum} of ${numPages})`}
          </p>
          {numPages > 1 && (
            <p className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => goToPage(pageNum - 1)}
                disabled={pageNum <= 1}
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => goToPage(pageNum + 1)}
                disabled={pageNum >= numPages}
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
              >
                Next →
              </button>
            </p>
          )}
          <div className="relative inline-block max-w-full">
            <canvas
              ref={pageCanvasRef}
              className="max-w-full rounded-lg border border-zinc-300 shadow-sm"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPlacement({
                  cx: (e.clientX - rect.left) / rect.width,
                  cy: (e.clientY - rect.top) / rect.height,
                });
              }}
            />
            {placement && sigUrl && (
              // biome-ignore lint/performance/noImgElement: blob URL preview
              <img
                src={sigUrl}
                alt="Signature preview"
                className="pointer-events-none absolute"
                style={{
                  left: `${(placement.cx - widthFrac / 2) * 100}%`,
                  top: `${(placement.cy - (widthFrac * sigAspect) / 2) * 100}%`,
                  width: `${widthFrac * 100}%`,
                }}
              />
            )}
          </div>
          <OptionRow label="Signature size">
            <input
              type="range"
              min={10}
              max={60}
              value={Math.round(widthFrac * 100)}
              onChange={(e) => setWidthFrac(Number(e.target.value) / 100)}
            />
          </OptionRow>
        </div>

        <RunButton
          busy={busy}
          disabled={!sigBytes || !placement}
          onClick={() =>
            run(async () => {
              if (!file || !sigBytes || !placement) return [];
              const bytes = await fileToBytes(file);
              const out = await runOp<Uint8Array>("placeSignature", [
                bytes,
                {
                  png: sigBytes,
                  pageIndex: pageNum - 1,
                  cx: placement.cx,
                  cy: placement.cy,
                  widthFrac,
                },
              ]);
              return [{ name: `${stem(file.name)}-signed.pdf`, bytes: out }];
            })
          }
        >
          Sign PDF
        </RunButton>
      </div>

      <ErrorNote message={error} />
      <ResultPanel
        results={results}
        onReset={() => {
          reset();
          setFile(null);
          setDoc(null);
          setPlacement(null);
        }}
      />
    </div>
  );
}
