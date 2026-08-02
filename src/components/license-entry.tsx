"use client";

import { useState } from "react";
import { getStoredLicense, storeLicense, verifyLicenseKey } from "@/lib/license/license";

export function LicenseEntry() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<string | null>(() =>
    typeof window !== "undefined" && getStoredLicense()
      ? "A license is active on this device."
      : null,
  );

  const activate = async () => {
    const payload = await verifyLicenseKey(key);
    if (!payload) {
      setStatus(
        "That key doesn't verify. Check for missing characters, or reply to your purchase email for help.",
      );
      return;
    }
    storeLicense(key.trim());
    setStatus(
      `Activated: ${payload.sku} license (${payload.seats} seat${payload.seats === 1 ? "" : "s"}). Thank you.`,
    );
    setKey("");
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Paste your license key"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={activate}
          disabled={key.trim().length === 0}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:bg-zinc-300"
        >
          Activate
        </button>
      </div>
      {status && <p className="text-sm text-ink-soft">{status}</p>}
      <p className="text-xs text-zinc-400">
        Activation is verified on your device with a signed key — no server call, works offline.
      </p>
    </div>
  );
}
