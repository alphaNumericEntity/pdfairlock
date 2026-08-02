import { verifyAsync } from "@noble/ed25519";

export const LICENSE_PUBLIC_KEY_B64URL = "REPLACE_WITH_REAL_PUBLIC_KEY_BEFORE_SELLING";

export type LicensePayload = {
  sku: "pro" | "team" | "site";
  seats: number;
  issued: string;
};

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifyLicenseKey(
  key: string,
  publicKeyB64url: string = LICENSE_PUBLIC_KEY_B64URL,
): Promise<LicensePayload | null> {
  try {
    const [payloadB64, sigB64] = key.trim().split(".");
    if (!payloadB64 || !sigB64) return null;
    const payloadBytes = b64urlToBytes(payloadB64);
    const sig = b64urlToBytes(sigB64);
    const pub = b64urlToBytes(publicKeyB64url);
    const valid = await verifyAsync(sig, payloadBytes, pub);
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as LicensePayload;
    if (!payload.sku || !payload.issued) return null;
    return payload;
  } catch {
    return null;
  }
}

const STORAGE_KEY = "airgap-license";

export function storeLicense(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function getStoredLicense(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
