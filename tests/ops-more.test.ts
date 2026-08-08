import { createCanvas } from "@napi-rs/canvas";
import { unzipSync } from "fflate";
import { degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  assembleMixed,
  cleanResave,
  deletePages,
  extractPages,
  imagesToPdf,
  mergePdfs,
  pageCount,
  placeSignature,
  rotatePages,
  zipFiles,
} from "@/lib/pdf/ops";
import type { ImagePage } from "@/lib/pdf/types";
import { drawnImageMatrices, pageContentStream } from "./pdf-inspect";

async function makePdf(pages: number, size: [number, number] = [595, 842]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    doc.addPage(size).drawText(`Page ${i + 1}`, { x: 50, y: size[1] - 50, size: 20, font });
  }
  return doc.save();
}

function blackPng(w: number, h: number): Uint8Array {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  return new Uint8Array(canvas.encodeSync("png"));
}

function jpegPage(widthPt: number, heightPt: number): ImagePage {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 100, 100);
  return {
    bytes: new Uint8Array(canvas.encodeSync("jpeg", 85)),
    format: "jpeg",
    widthPt,
    heightPt,
  };
}

describe("placeSignature", () => {
  const cases = [
    { cx: 0.5, cy: 0.5, widthFrac: 0.25, pageIndex: 0 },
    { cx: 0.7, cy: 0.6, widthFrac: 0.25, pageIndex: 0 },
    { cx: 0.2, cy: 0.85, widthFrac: 0.4, pageIndex: 1 },
    { cx: 0.9, cy: 0.1, widthFrac: 0.1, pageIndex: 0 },
  ];
  for (const c of cases) {
    it(`places at cx=${c.cx} cy=${c.cy} width=${c.widthFrac} page=${c.pageIndex}`, async () => {
      const src = await makePdf(2);
      const png = blackPng(100, 36);
      const out = await placeSignature(src, { png, ...c });

      const matrices = await drawnImageMatrices(out, c.pageIndex);
      expect(matrices).toHaveLength(1);
      const m = matrices[0];
      const expectedW = 595 * c.widthFrac;
      const expectedH = expectedW * (36 / 100);
      expect(m.w).toBeCloseTo(expectedW, 1);
      expect(m.h).toBeCloseTo(expectedH, 1);
      expect(m.x).toBeCloseTo(c.cx * 595 - expectedW / 2, 1);
      expect(m.y).toBeCloseTo((1 - c.cy) * 842 - expectedH / 2, 1);

      const otherPage = c.pageIndex === 0 ? 1 : 0;
      expect(await drawnImageMatrices(out, otherPage)).toHaveLength(0);
    });
  }

  it("rejects an out-of-range page index", async () => {
    const src = await makePdf(1);
    await expect(
      placeSignature(src, {
        png: blackPng(10, 10),
        pageIndex: 5,
        cx: 0.5,
        cy: 0.5,
        widthFrac: 0.2,
      }),
    ).rejects.toThrow(/page not found/i);
  });
});

describe("imagesToPdf", () => {
  it("fit mode sizes pages from pixels at 96dpi", async () => {
    const out = await imagesToPdf(
      [{ bytes: blackPng(96, 192), format: "png", pxWidth: 96, pxHeight: 192 }],
      { pageSize: "fit", marginPt: 36 },
    );
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(72, 1);
    expect(doc.getPage(0).getHeight()).toBeCloseTo(144, 1);
  });

  it("a4 mode uses A4 pages and centers the image within margins", async () => {
    const out = await imagesToPdf(
      [{ bytes: blackPng(200, 100), format: "png", pxWidth: 200, pxHeight: 100 }],
      { pageSize: "a4", marginPt: 36 },
    );
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
    expect(doc.getPage(0).getHeight()).toBeCloseTo(841.89, 1);
    const [m] = await drawnImageMatrices(out, 0);
    expect(m.w).toBeCloseTo(595.28 - 72, 1);
    expect(m.x).toBeCloseTo(36, 1);
    expect(m.h).toBeCloseTo(m.w / 2, 1);
  });

  it("keeps input order across mixed formats", async () => {
    const jpeg = jpegPage(100, 100);
    const out = await imagesToPdf(
      [
        { bytes: blackPng(10, 10), format: "png", pxWidth: 10, pxHeight: 10 },
        { bytes: jpeg.bytes, format: "jpeg", pxWidth: 100, pxHeight: 100 },
      ],
      { pageSize: "fit", marginPt: 0 },
    );
    expect(await pageCount(out)).toBe(2);
  });
});

describe("assembleMixed ordering", () => {
  it("replaces only the middle page and keeps the others' content", async () => {
    const src = await makePdf(3);
    const out = await assembleMixed(src, [{ pageIndex: 1, image: jpegPage(595, 842) }]);

    expect(await pageCount(out)).toBe(3);
    expect(await pageContentStream(out, 0)).toContain("Tj");
    expect((await drawnImageMatrices(out, 1)).length).toBe(1);
    expect(await pageContentStream(out, 2)).toContain("Tj");
  });
});

describe("ops edge cases", () => {
  it("merging a single file keeps its page count", async () => {
    const merged = await mergePdfs([{ name: "a.pdf", bytes: await makePdf(3) }]);
    expect(await pageCount(merged)).toBe(3);
  });

  it("extractPages throws on an out-of-range index", async () => {
    await expect(extractPages(await makePdf(2), [5])).rejects.toThrow();
  });

  it("deletePages with no indices keeps every page", async () => {
    const out = await deletePages(await makePdf(3), []);
    expect(await pageCount(out)).toBe(3);
  });

  it("rotatePages leaves untargeted pages alone", async () => {
    const out = await rotatePages(await makePdf(2), [0], 90);
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
  });

  it("rotatePages composes with an existing page rotation", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]).setRotation(degrees(180));
    const out = await rotatePages(await doc.save(), "all", 270);
    const reopened = await PDFDocument.load(out);
    expect(reopened.getPage(0).getRotation().angle).toBe(90);
  });

  it("cleanResave keeps the document loadable with the same page count", async () => {
    const out = await cleanResave(await makePdf(4));
    expect(await pageCount(out)).toBe(4);
  });

  it("zipFiles roundtrips content through unzip", () => {
    const files = [
      { name: "one.txt", bytes: new TextEncoder().encode("first") },
      { name: "two.txt", bytes: new TextEncoder().encode("second") },
    ];
    const unzipped = unzipSync(zipFiles(files));
    expect(Object.keys(unzipped).sort()).toEqual(["one.txt", "two.txt"]);
    expect(new TextDecoder().decode(unzipped["one.txt"])).toBe("first");
    expect(new TextDecoder().decode(unzipped["two.txt"])).toBe("second");
  });
});
