import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { createQpdf } from "@/lib/pdf/qpdf-core";

const WASM = join(__dirname, "../node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm");
const qpdf = createQpdf(WASM);

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]).drawText("Protected content", { x: 50, y: 800, size: 18 });
  doc.addPage([595, 842]);
  return doc.save();
}

describe("qpdf password tools", () => {
  it("protect then unlock roundtrips, and the protected file is really encrypted", async () => {
    const original = await makePdf();
    const protectedBytes = await qpdf.protect(original, "hunter2");

    const loaded = await PDFDocument.load(protectedBytes, { ignoreEncryption: true });
    expect(loaded.isEncrypted).toBe(true);

    const unlocked = await qpdf.unlock(protectedBytes, "hunter2");
    const reopened = await PDFDocument.load(unlocked);
    expect(reopened.isEncrypted).toBe(false);
    expect(reopened.getPageCount()).toBe(2);
  });

  it("rejects a wrong password with a friendly message", async () => {
    const original = await makePdf();
    const protectedBytes = await qpdf.protect(original, "correct");
    await expect(qpdf.unlock(protectedBytes, "wrong")).rejects.toThrow(/incorrect/i);
  });

  it("asks for a password when none was given for an encrypted file", async () => {
    const original = await makePdf();
    const protectedBytes = await qpdf.protect(original, "correct");
    await expect(qpdf.unlock(protectedBytes, "")).rejects.toThrow(/needs a password/i);
  });

  it("explains when a file isn't encrypted at all", async () => {
    const original = await makePdf();
    await expect(qpdf.unlock(original, "whatever")).rejects.toThrow(/isn't password-protected/i);
  });

  it("roundtrips a password with spaces and symbols", async () => {
    const password = "p@ss word! & <chars> #42";
    const protectedBytes = await qpdf.protect(await makePdf(), password);
    const unlocked = await qpdf.unlock(protectedBytes, password);
    expect((await PDFDocument.load(unlocked)).getPageCount()).toBe(2);
  });

  it("rejects garbage input bytes with a friendly error", async () => {
    await expect(qpdf.protect(new Uint8Array([1, 2, 3]), "pw")).rejects.toThrow(/could not/i);
  });
});
