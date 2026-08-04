"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useRef, useState } from "react";
import { fileToBytes } from "@/lib/download";
import { openPdf, renderPage, searchText } from "@/lib/pdf/pdfjs";
import { stem } from "@/lib/pdf/ranges";
import {
  type RedactionReport,
  type RedactMode,
  redactPdf,
  verifyRedaction,
} from "@/lib/pdf/redact";
import type { RedactBox } from "@/lib/pdf/types";
import {
  ErrorNote,
  FileDrop,
  ProgressBar,
  ResultPanel,
  RunButton,
  useToolRunner,
} from "../tool-ui";

type DraftBox = { x0: number; y0: number; x1: number; y1: number };

export function RedactTool() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftBox | null>(null);
  const [mode, setMode] = useState<RedactMode>("mixed");
  const [report, setReport] = useState<RedactionReport | null>(null);

  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { busy, progress, error, results, run, reset, setError } = useToolRunner();

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
      setBoxes([]);
      setTerms([]);
      setReport(null);
      await showPage(d, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const goToPage = async (p: number) => {
    if (!doc || p < 1 || p > numPages) return;
    setPageNum(p);
    await showPage(doc, p);
  };

  const runSearch = async () => {
    if (!doc || query.trim().length === 0) return;
    setSearchBusy(true);
    setSearchMsg(null);
    try {
      const matches = await searchText(doc, query.trim());
      if (matches.length === 0) {
        setSearchMsg(
          `"${query.trim()}" not found in the text layer. If this is a scanned document, draw boxes manually instead.`,
        );
      } else {
        setBoxes((prev) => [
          ...prev,
          ...matches.map((m) => ({ page: m.page, x: m.x, y: m.y, w: m.w, h: m.h })),
        ]);
        setTerms((prev) => (prev.includes(query.trim()) ? prev : [...prev, query.trim()]));
        setSearchMsg(
          `Marked ${matches.length} match${matches.length === 1 ? "" : "es"} across the document.`,
        );
        setQuery("");
      }
    } finally {
      setSearchBusy(false);
    }
  };

  const overlayPos = (e: React.PointerEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const pageBoxes = boxes.filter((b) => b.page === pageNum);

  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-zinc-200 bg-surface px-4 py-3 text-sm text-ink-soft">
        Redacted pages are rebuilt as flat images — the underlying text is destroyed, not hidden.
        The output is then re-scanned and you get a verification report. Always review the result
        before distributing it.
      </p>
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => onFile(f[0])}
          label="Choose a PDF to redact"
        />
      )}

      <div className={file ? "space-y-5" : "hidden"}>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Find text to redact</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="e.g. a name, SSN, email"
              className="w-64 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={runSearch}
            disabled={searchBusy || query.trim().length === 0}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-soft disabled:opacity-50"
          >
            {searchBusy ? "Searching…" : "Mark all matches"}
          </button>
          <span className="text-sm text-ink-soft">or drag on the page to draw a box</span>
        </div>
        {searchMsg && <p className="text-sm text-ink-soft">{searchMsg}</p>}
        {terms.length > 0 && (
          <p className="text-sm">
            Terms to verify after redaction:{" "}
            {terms.map((t) => (
              <span key={t} className="mr-1 rounded bg-zinc-100 px-2 py-0.5">
                {t}
              </span>
            ))}
          </p>
        )}

        <div className="space-y-2">
          {numPages > 1 && (
            <p className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => goToPage(pageNum - 1)}
                disabled={pageNum <= 1}
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span>
                Page {pageNum} of {numPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(pageNum + 1)}
                disabled={pageNum >= numPages}
                className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-40"
              >
                Next →
              </button>
              {boxes.length > 0 && (
                <span className="text-ink-soft">
                  · {boxes.length} box{boxes.length === 1 ? "" : "es"} total
                </span>
              )}
            </p>
          )}
          <div className="relative inline-block max-w-full">
            <canvas
              ref={pageCanvasRef}
              className="max-w-full rounded-lg border border-zinc-300 shadow-sm"
            />
            <div
              ref={overlayRef}
              className="absolute inset-0 cursor-crosshair touch-none"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const { x, y } = overlayPos(e);
                setDraft({ x0: x, y0: y, x1: x, y1: y });
              }}
              onPointerMove={(e) => {
                if (!draft) return;
                const { x, y } = overlayPos(e);
                setDraft({ ...draft, x1: x, y1: y });
              }}
              onPointerUp={() => {
                if (!draft) return;
                const x = Math.min(draft.x0, draft.x1);
                const y = Math.min(draft.y0, draft.y1);
                const w = Math.abs(draft.x1 - draft.x0);
                const h = Math.abs(draft.y1 - draft.y0);
                if (w > 0.005 && h > 0.005) {
                  setBoxes((prev) => [...prev, { page: pageNum, x, y, w, h }]);
                }
                setDraft(null);
              }}
            >
              {pageBoxes.map((b, i) => (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: coords+index; boxes are stateless overlays
                  key={`${b.x}-${b.y}-${i}`}
                  type="button"
                  title="Click to remove this box"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoxes((prev) => prev.filter((pb) => pb !== b));
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute bg-black/85 outline-2 outline-red-500 hover:bg-red-900"
                  style={{
                    left: `${b.x * 100}%`,
                    top: `${b.y * 100}%`,
                    width: `${b.w * 100}%`,
                    height: `${b.h * 100}%`,
                  }}
                />
              ))}
              {draft && (
                <div
                  className="absolute border border-red-500 bg-black/60"
                  style={{
                    left: `${Math.min(draft.x0, draft.x1) * 100}%`,
                    top: `${Math.min(draft.y0, draft.y1) * 100}%`,
                    width: `${Math.abs(draft.x1 - draft.x0) * 100}%`,
                    height: `${Math.abs(draft.y1 - draft.y0) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <label className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RedactMode)}
            className="rounded-lg border border-zinc-300 bg-surface px-3 py-2"
          >
            <option value="mixed">Rebuild only redacted pages (keeps text elsewhere)</option>
            <option value="flatten">Flatten entire document (every page becomes an image)</option>
          </select>
        </label>

        <RunButton
          busy={busy}
          disabled={boxes.length === 0}
          onClick={() =>
            run(async (reportProgress) => {
              if (!file) return [];
              setReport(null);
              const bytes = await fileToBytes(file);
              const { output, redactedPages } = await redactPdf(bytes, boxes, mode, reportProgress);
              reportProgress({ done: 1, total: 1, label: "Verifying redaction" });
              setReport(await verifyRedaction(output, mode, redactedPages, terms));
              return [{ name: `${stem(file.name)}-redacted.pdf`, bytes: output }];
            })
          }
        >
          Redact {boxes.length > 0 ? `${boxes.length} area${boxes.length === 1 ? "" : "s"}` : ""}{" "}
          &amp; verify
        </RunButton>
      </div>

      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
      {report && (
        <div
          className={`space-y-1.5 rounded-2xl border p-5 text-sm ${
            report.ok ? "border-brand/40 bg-brand-soft" : "border-amber-300 bg-amber-50"
          }`}
        >
          <p className="font-semibold">{report.ok ? "✓ Redaction verified" : "⚠ Review needed"}</p>
          <p>
            {report.textOnRedactedPages.length === 0
              ? "✓ Redacted pages contain zero extractable text."
              : `⚠ Text still extractable on redacted page(s) ${report.textOnRedactedPages.join(", ")} — do not distribute without review.`}
          </p>
          {terms.length === 0 ? (
            <p>· No search terms to verify (boxes drawn manually).</p>
          ) : Object.keys(report.termHitsByPage).length === 0 &&
            report.termsInBytes.length === 0 ? (
            <p>✓ None of your search terms appear anywhere in the output.</p>
          ) : (
            <>
              {Object.entries(report.termHitsByPage).map(([term, pages]) => (
                <p key={term}>
                  ⚠ &ldquo;{term}&rdquo; still appears on page{pages.length === 1 ? "" : "s"}{" "}
                  {pages.join(", ")} — add a box there and run again.
                </p>
              ))}
              {report.termsInBytes.length > 0 && (
                <p>
                  ⚠ Found in raw file bytes (not visible text): {report.termsInBytes.join(", ")} —
                  use Flatten mode for maximum assurance.
                </p>
              )}
            </>
          )}
          <p>✓ Document metadata (title, author, XMP) stripped.</p>
          <p className="text-ink-soft">
            {report.mode === "mixed"
              ? `Pages rebuilt as images: ${report.redactedPages.join(", ")} of ${numPages}. All other pages are untouched and keep their selectable text.`
              : `All ${numPages} pages were flattened to images; the whole document's text layer is gone.`}
          </p>
        </div>
      )}
      <ResultPanel
        results={results}
        onReset={() => {
          reset();
          setFile(null);
          setDoc(null);
          setBoxes([]);
          setTerms([]);
          setReport(null);
        }}
      />
    </div>
  );
}
