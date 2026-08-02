import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPageNumbers,
  deletePages,
  extractPages,
  mergePdfs,
  pageCount,
  rotatePages,
  splitEveryPage,
  watermarkPdf,
  zipFiles,
} from "@/lib/pdf/ops";

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 800, size: 24 });
  }
  return doc.save();
}

describe("mergePdfs", () => {
  it("concatenates all pages in order", async () => {
    const a = await makePdf(2);
    const b = await makePdf(3);
    const merged = await mergePdfs([
      { name: "a.pdf", bytes: a },
      { name: "b.pdf", bytes: b },
    ]);
    expect(await pageCount(merged)).toBe(5);
  });

  it("reports progress per file", async () => {
    const a = await makePdf(1);
    const seen: number[] = [];
    await mergePdfs(
      [
        { name: "a.pdf", bytes: a },
        { name: "b.pdf", bytes: a },
      ],
      (done) => seen.push(done),
    );
    expect(seen).toEqual([1, 2]);
  });

  it("rejects a corrupted file with a readable error", async () => {
    await expect(
      mergePdfs([{ name: "bad.pdf", bytes: new Uint8Array([1, 2, 3]) }]),
    ).rejects.toThrow(/could not read/i);
  });
});

describe("extract/delete", () => {
  it("extracts the selected pages only", async () => {
    const src = await makePdf(5);
    const out = await extractPages(src, [0, 2, 4]);
    expect(await pageCount(out)).toBe(3);
  });

  it("deletes the selected pages", async () => {
    const src = await makePdf(5);
    const out = await deletePages(src, [0, 1]);
    expect(await pageCount(out)).toBe(3);
  });

  it("refuses to delete every page", async () => {
    const src = await makePdf(2);
    await expect(deletePages(src, [0, 1])).rejects.toThrow(/every page/i);
  });
});

describe("splitEveryPage", () => {
  it("produces one file per page with page-numbered names", async () => {
    const src = await makePdf(3);
    const parts = await splitEveryPage(src, "doc");
    expect(parts.map((p) => p.name)).toEqual([
      "doc-page-1.pdf",
      "doc-page-2.pdf",
      "doc-page-3.pdf",
    ]);
    for (const part of parts) expect(await pageCount(part.bytes)).toBe(1);
  });
});

describe("rotatePages", () => {
  it("rotates all pages and normalizes the angle", async () => {
    const src = await makePdf(2);
    const out = await rotatePages(src, "all", 270);
    const doc = await PDFDocument.load(out);
    for (const page of doc.getPages()) expect(page.getRotation().angle).toBe(270);
  });

  it("wraps past 360", async () => {
    const src = await makePdf(1);
    const once = await rotatePages(src, "all", 270);
    const twice = await rotatePages(once, "all", 180);
    const doc = await PDFDocument.load(twice);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
  });
});

describe("decorations", () => {
  it("watermark and page numbers keep page count and grow content", async () => {
    const src = await makePdf(2);
    const wm = await watermarkPdf(src, {
      text: "CONFIDENTIAL",
      fontSize: 60,
      opacity: 0.25,
      rotate: 40,
      color: "gray",
    });
    const numbered = await addPageNumbers(src);
    expect(await pageCount(wm)).toBe(2);
    expect(await pageCount(numbered)).toBe(2);
  });
});

describe("zipFiles", () => {
  it("produces a zip with the right magic bytes", () => {
    const zip = zipFiles([{ name: "x.txt", bytes: new TextEncoder().encode("hello") }]);
    expect([zip[0], zip[1]]).toEqual([0x50, 0x4b]);
  });
});
