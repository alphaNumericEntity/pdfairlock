"use client";

import Link from "next/link";
import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { checkRedaction, type RedactionCheck } from "@/lib/pdf/redaction-check";
import type { Progress } from "@/lib/pdf/types";
import { ErrorNote, FileDrop, ProgressBar } from "../tool-ui";

const VERDICT = {
  leak: {
    title: "⚠ Not properly redacted",
    body: "Sensitive content is still recoverable from this file. Details below.",
    className: "border-red-300 bg-red-50 text-red-900",
  },
  warn: {
    title: "Review needed",
    body: "No text found under boxes, but something below deserves a look before this file goes out.",
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  clean: {
    title: "✓ Nothing recoverable found",
    body: "No text under dark boxes, no pending redaction marks, no leftover terms, no identifying metadata.",
    className: "border-brand/40 bg-brand-soft text-ink",
  },
} as const;

function splitTerms(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function RedactionCheckerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [terms, setTerms] = useState("");
  const [report, setReport] = useState<RedactionCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async (f: File, rawTerms: string) => {
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      setReport(await checkRedaction(await fileToBytes(f), splitTerms(rawTerms), setProgress));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const pagesWithBoxes = report?.pages.filter((p) => p.darkRects.length > 0) ?? [];
  const leakPages = report?.pages.filter((p) => p.textUnderRects.length > 0) ?? [];
  const totalChars = report?.pages.reduce((n, p) => n + p.textChars, 0) ?? 0;

  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-zinc-200 bg-surface px-4 py-3 text-sm text-ink-soft">
        Drop a PDF that has already been redacted. The checker renders every page, finds the dark
        boxes, and looks for text still sitting underneath them — the copy-and-paste leak — plus
        redaction marks that were never applied, leftover search terms and identifying metadata. The
        file is inspected in your browser and never uploaded.
      </p>
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(files) => {
            setFile(files[0]);
            runCheck(files[0], terms);
          }}
          label="Choose a redacted PDF to check"
        />
      )}
      {file && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Terms that should be gone (optional)</span>
            <input
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && runCheck(file, terms)}
              placeholder="e.g. Jane Exampleton, 000-00-0000"
              className="w-80 max-w-full rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={() => runCheck(file, terms)}
            disabled={busy}
            className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-soft disabled:opacity-50"
          >
            {busy ? "Checking…" : "Check again"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setReport(null);
              setError(null);
            }}
            className="text-sm text-brand-dark underline"
          >
            Start over
          </button>
        </div>
      )}
      <ProgressBar progress={progress} />
      <ErrorNote message={error} />
      {report && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 ${VERDICT[report.verdict].className}`}>
            <p className="font-semibold">{VERDICT[report.verdict].title}</p>
            <p className="mt-1 text-sm">{VERDICT[report.verdict].body}</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-surface p-5 text-sm">
            <div>
              <p className="font-semibold">
                {leakPages.length > 0 ? "⚠" : "✓"} Text under dark boxes
              </p>
              {leakPages.length === 0 ? (
                <p className="mt-1 text-ink-soft">
                  {pagesWithBoxes.length === 0
                    ? "No dark boxes were found on any page."
                    : `${pagesWithBoxes.reduce((n, p) => n + p.darkRects.length, 0)} dark box(es) found on page(s) ${pagesWithBoxes.map((p) => p.page).join(", ")}, with no extractable text underneath.`}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {leakPages.map((p) => (
                    <li key={p.page}>
                      <span className="font-medium">Page {p.page}:</span>{" "}
                      {p.textUnderRects.map((t) => (
                        <code key={t} className="mr-1 rounded bg-red-50 px-1.5 py-0.5 text-red-900">
                          {t}
                        </code>
                      ))}
                    </li>
                  ))}
                  <li className="text-ink-soft">
                    This text is still in the file. Anyone can select, search or extract it.
                  </li>
                </ul>
              )}
            </div>

            <div>
              <p className="font-semibold">
                {report.pendingRedactAnnotations > 0 ? "⚠" : "✓"} Pending redaction marks
              </p>
              <p className="mt-1 text-ink-soft">
                {report.pendingRedactAnnotations > 0
                  ? `${report.pendingRedactAnnotations} redaction annotation(s) were marked but never applied. The content underneath is untouched.`
                  : "No unapplied redaction annotations."}
              </p>
            </div>

            <div>
              <p className="font-semibold">
                {Object.keys(report.termHitsByPage).length > 0 || report.termsInBytes.length > 0
                  ? "⚠"
                  : "✓"}{" "}
                Terms that should be gone
              </p>
              {splitTerms(terms).length === 0 ? (
                <p className="mt-1 text-ink-soft">
                  Add the names or numbers you redacted above and check again; the report will say
                  on which pages they survive.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-ink-soft">
                  {splitTerms(terms).map((t) => (
                    <li key={t}>
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-ink">{t}</code>{" "}
                      {report.termHitsByPage[t]
                        ? `still appears on page(s) ${report.termHitsByPage[t].join(", ")}`
                        : report.termsInBytes.includes(t)
                          ? "not in the visible text, but present in the raw file bytes (metadata or hidden content)"
                          : "not found anywhere in the file"}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="font-semibold">
                {report.metadata.length > 0 || report.xmpPresent ? "⚠" : "✓"} Document metadata
              </p>
              {report.metadata.length === 0 && !report.xmpPresent ? (
                <p className="mt-1 text-ink-soft">
                  No title, author, subject, keywords or XMP metadata.
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-ink-soft">
                  {report.metadata.map((m) => (
                    <li key={m.key}>
                      <span className="font-medium text-ink">{m.key}:</span> {m.value}
                    </li>
                  ))}
                  {report.xmpPresent && (
                    <li>XMP metadata stream present (can carry author and history).</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <p className="font-semibold">Text layer</p>
              <p className="mt-1 text-ink-soft">
                {report.hasTextLayer
                  ? `${totalChars.toLocaleString()} characters of extractable text across ${report.pages.length} page(s).`
                  : "No extractable text on any page. This looks like a scan; boxes on a scan hide pixels only, and there is no text layer to leak unless OCR was added."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand/30 bg-brand-soft p-5 text-sm">
            <p className="font-semibold text-brand-dark">
              {report.verdict === "leak" ? "Fix it properly" : "Redacting another document?"}
            </p>
            <p className="mt-1 text-ink-soft">
              <Link href="/redact-pdf" className="font-medium text-brand-dark underline">
                Redact PDF
              </Link>{" "}
              rebuilds the marked pages so the text ceases to exist, strips the metadata, and runs
              this same verification on its own output before you download.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
