import * as ed from "@noble/ed25519";
import { describe, expect, it } from "vitest";
import { verifyLicenseKey } from "@/lib/license/license";

const b64url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");

async function makeKey(payload: object, priv: Uint8Array): Promise<string> {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await ed.signAsync(payloadBytes, priv);
  return `${b64url(payloadBytes)}.${b64url(sig)}`;
}

describe("verifyLicenseKey", () => {
  it("accepts a correctly signed key", async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKeyAsync(priv);
    const key = await makeKey({ sku: "pro", seats: 1, issued: "2026-08-02" }, priv);
    const result = await verifyLicenseKey(key, b64url(pub));
    expect(result).toEqual({ sku: "pro", seats: 1, issued: "2026-08-02" });
  });

  it("rejects a tampered payload", async () => {
    const priv = ed.utils.randomPrivateKey();
    const pub = await ed.getPublicKeyAsync(priv);
    const key = await makeKey({ sku: "pro", seats: 1, issued: "2026-08-02" }, priv);
    const forged = `${Buffer.from(JSON.stringify({ sku: "site", seats: 999, issued: "2026-08-02" })).toString("base64url")}.${key.split(".")[1]}`;
    expect(await verifyLicenseKey(forged, b64url(pub))).toBeNull();
  });

  it("rejects a key signed by a different keypair", async () => {
    const privA = ed.utils.randomPrivateKey();
    const privB = ed.utils.randomPrivateKey();
    const pubB = await ed.getPublicKeyAsync(privB);
    const key = await makeKey({ sku: "pro", seats: 1, issued: "2026-08-02" }, privA);
    expect(await verifyLicenseKey(key, b64url(pubB))).toBeNull();
  });

  it("rejects garbage without throwing", async () => {
    expect(await verifyLicenseKey("not-a-key", "AAAA")).toBeNull();
    expect(await verifyLicenseKey("", "AAAA")).toBeNull();
    expect(await verifyLicenseKey("a.b.c", "AAAA")).toBeNull();
  });
});
