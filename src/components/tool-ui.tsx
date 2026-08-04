"use client";

import { useRef, useState } from "react";
import { downloadBytes } from "@/lib/download";
import { formatBytes } from "@/lib/pdf/ranges";
import type { Progress } from "@/lib/pdf/types";
import { runOp } from "@/lib/worker/client";
import { FileIcon, ShieldIcon } from "./icons";

const WARN_BYTES = 200 * 1024 * 1024;

export function PrivacyBadge() {
  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm text-brand-dark">
      <ShieldIcon className="h-4 w-4" />
      Processed on your device — nothing is uploaded. Works offline.
    </p>
  );
}

export function FileDrop({
  accept,
  multiple,
  onFiles,
  label,
}: {
  accept: string;
  multiple: boolean;
  onFiles: (files: File[]) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = [...list];
    const big = files.find((f) => f.size > WARN_BYTES);
    setWarning(
      big
        ? `${big.name} is ${formatBytes(big.size)}. Large files are processed entirely in memory — this can be slow or fail on low-memory devices.`
        : null,
    );
    onFiles(files);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-brand bg-brand-soft" : "border-zinc-300 bg-surface hover:border-brand"
        }`}
      >
        <FileIcon className="h-10 w-10 text-brand" />
        <span className="font-medium">{label}</span>
        <span className="text-sm text-ink-soft">Drag &amp; drop or click to browse</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
      {warning && <p className="mt-2 text-sm text-amber-700">{warning}</p>}
    </div>
  );
}

export function FileListEditor({
  files,
  onChange,
}: {
  files: File[];
  onChange: (next: File[]) => void;
}) {
  if (files.length === 0) return null;
  const move = (i: number, dir: -1 | 1) => {
    const next = [...files];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ul className="space-y-2">
      {files.map((f, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: duplicate names allowed; items hold no state
          key={`${f.name}-${i}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-surface px-4 py-2.5"
        >
          <span className="truncate text-sm">
            {i + 1}. {f.name} <span className="text-xs text-ink-soft">({formatBytes(f.size)})</span>
          </span>
          <span className="flex gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              className="rounded px-2 py-1 text-sm hover:bg-zinc-100"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              className="rounded px-2 py-1 text-sm hover:bg-zinc-100"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
              aria-label="Remove"
            >
              ✕
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProgressBar({ progress }: { progress: Progress | null }) {
  if (!progress) return null;
  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-ink-soft">
        {progress.label ?? "Processing"} — {progress.done}/{progress.total}
      </p>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </p>
  );
}

export type ResultFile = {
  name: string;
  bytes: Uint8Array;
  mime?: string;
};

export function ResultPanel({
  results,
  note,
  onReset,
}: {
  results: ResultFile[];
  note?: string;
  onReset: () => void;
}) {
  if (results.length === 0) return null;
  return (
    <div className="space-y-3 rounded-2xl border border-brand/30 bg-brand-soft p-5">
      <p className="font-medium text-brand-dark">
        Done — download your {results.length === 1 ? "file" : "files"}:
      </p>
      <ul className="space-y-2">
        {results.map((r) => (
          <li
            key={r.name}
            className="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-2.5"
          >
            <span className="truncate text-sm">{r.name}</span>
            <span className="flex items-center gap-3">
              <span className="whitespace-nowrap text-xs text-ink-soft">
                {formatBytes(r.bytes.length)}
              </span>
              <button
                type="button"
                onClick={() => downloadBytes(r.bytes, r.name, r.mime)}
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Download
              </button>
            </span>
          </li>
        ))}
      </ul>
      {note && <p className="text-sm text-ink-soft">{note}</p>}
      <div className="flex items-center gap-4">
        {results.length > 1 && (
          <button
            type="button"
            onClick={async () => {
              const zip = await runOp<Uint8Array>("zipFiles", [
                results.map((r) => ({ name: r.name, bytes: r.bytes })),
              ]);
              downloadBytes(zip, "airgap-pdf-batch.zip", "application/zip");
            }}
            className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-surface"
          >
            Download all as .zip
          </button>
        )}
        <button type="button" onClick={onReset} className="text-sm text-brand-dark underline">
          Start over
        </button>
      </div>
    </div>
  );
}

export function RunButton({
  onClick,
  disabled,
  busy,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="rounded-xl bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      {busy ? "Working…" : children}
    </button>
  );
}

export function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-wrap items-center gap-3 text-sm">
      <span className="w-36 font-medium">{label}</span>
      {children}
    </label>
  );
}

export function useToolRunner() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);

  const run = async (fn: (report: (p: Progress) => void) => Promise<ResultFile[]>) => {
    setBusy(true);
    setError(null);
    setResults([]);
    setProgress(null);
    try {
      setResults(await fn(setProgress));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const reset = () => {
    setResults([]);
    setError(null);
    setProgress(null);
  };

  return { busy, progress, error, results, run, reset, setError };
}
