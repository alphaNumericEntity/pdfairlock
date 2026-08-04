"use client";

import { useState } from "react";
import { fileToBytes } from "@/lib/download";
import { stem } from "@/lib/pdf/ranges";
import { runQpdfOp } from "@/lib/worker/client";
import { ErrorNote, FileDrop, OptionRow, ResultPanel, RunButton, useToolRunner } from "../tool-ui";

export function PasswordTool({ mode }: { mode: "unlock" | "protect" }) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, results, run, reset, setError } = useToolRunner();
  const unlock = mode === "unlock";

  return (
    <div className="space-y-5">
      {!file && (
        <FileDrop
          accept="application/pdf"
          multiple={false}
          onFiles={(f) => setFile(f[0])}
          label={unlock ? "Choose a password-protected PDF" : "Choose a PDF to protect"}
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
          <OptionRow label={unlock ? "Password" : "New password"}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={unlock ? "Leave empty if it opens without one" : "Choose a password"}
              className="w-64 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
            />
          </OptionRow>
          {!unlock && (
            <OptionRow label="Confirm password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-64 rounded-lg border border-zinc-300 bg-surface px-3 py-2"
              />
            </OptionRow>
          )}
          {unlock && (
            <p className="text-sm text-ink-soft">
              This removes the password and any printing/copying restrictions from a file you have
              the right to open. The password itself never leaves your device.
            </p>
          )}
          <RunButton
            busy={busy}
            disabled={!unlock && password.length === 0}
            onClick={() => {
              if (!unlock && password !== confirm) {
                setError("The passwords don't match.");
                return;
              }
              run(async () => {
                const bytes = await fileToBytes(file);
                const op = unlock ? "unlock" : "protect";
                const out = await runQpdfOp<Uint8Array>(op, [bytes, password]);
                const suffix = unlock ? "unlocked" : "protected";
                return [{ name: `${stem(file.name)}-${suffix}.pdf`, bytes: out }];
              });
            }}
          >
            {unlock ? "Remove password" : "Add password (AES-256)"}
          </RunButton>
        </>
      )}
      <ErrorNote message={error} />
      <ResultPanel
        results={results}
        onReset={() => {
          reset();
          setFile(null);
          setPassword("");
          setConfirm("");
        }}
      />
    </div>
  );
}
