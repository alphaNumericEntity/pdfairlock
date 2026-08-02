import * as ed from "@noble/ed25519";

const b64url = (bytes) => Buffer.from(bytes).toString("base64url");

const mode = process.argv[2];

if (mode === "keypair") {
  const priv = ed.utils.randomPrivateKey();
  const pub = await ed.getPublicKeyAsync(priv);
  console.log("PRIVATE (keep in password manager, never in repo):", b64url(priv));
  console.log("PUBLIC  (paste into src/lib/license/keys.ts):", b64url(pub));
} else if (mode === "sign") {
  const priv = process.env.AIRGAP_LICENSE_PRIVATE_KEY;
  if (!priv) {
    console.error("Set AIRGAP_LICENSE_PRIVATE_KEY env var");
    process.exit(1);
  }
  const sku = process.argv[3] ?? "pro";
  const seats = Number(process.argv[4] ?? 1);
  const payload = JSON.stringify({ sku, seats, issued: new Date().toISOString().slice(0, 10) });
  const payloadBytes = new TextEncoder().encode(payload);
  const sig = await ed.signAsync(payloadBytes, Buffer.from(priv, "base64url"));
  console.log(`${b64url(payloadBytes)}.${b64url(sig)}`);
} else {
  console.log("usage: node scripts/keygen.mjs keypair | sign [sku] [seats]");
}
