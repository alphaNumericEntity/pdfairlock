import { unzlibSync } from "fflate";
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

export async function pageContentStream(bytes: Uint8Array, pageIndex: number): Promise<string> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const contents = page.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  let out = "";
  for (const ref of refs) {
    const stream = doc.context.lookup(ref);
    if (!(stream instanceof PDFRawStream)) continue;
    const raw = stream.getContents();
    const filter = stream.dict.lookupMaybe(PDFName.of("Filter"), PDFName);
    out += new TextDecoder("latin1").decode(
      filter?.asString() === "/FlateDecode" ? unzlibSync(raw) : raw,
    );
    out += "\n";
  }
  return out;
}

export type ImageMatrix = { w: number; h: number; x: number; y: number };

type Affine = { a: number; b: number; c: number; d: number; e: number; f: number };

function compose(outer: Affine, inner: Affine): Affine {
  return {
    a: outer.a * inner.a + outer.c * inner.b,
    b: outer.b * inner.a + outer.d * inner.b,
    c: outer.a * inner.c + outer.c * inner.d,
    d: outer.b * inner.c + outer.d * inner.d,
    e: outer.a * inner.e + outer.c * inner.f + outer.e,
    f: outer.b * inner.e + outer.d * inner.f + outer.f,
  };
}

export async function drawnImageMatrices(
  bytes: Uint8Array,
  pageIndex: number,
): Promise<ImageMatrix[]> {
  const content = await pageContentStream(bytes, pageIndex);
  const out: ImageMatrix[] = [];
  const CM = /(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+cm/g;
  const blockRe =
    /((?:-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s+-?[\d.]+\s+cm\s*)+)\/[\w-]+\s+Do/g;
  for (const block of content.matchAll(blockRe)) {
    let eff: Affine = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    for (const m of block[1].matchAll(CM)) {
      eff = compose(eff, {
        a: Number(m[1]),
        b: Number(m[2]),
        c: Number(m[3]),
        d: Number(m[4]),
        e: Number(m[5]),
        f: Number(m[6]),
      });
    }
    out.push({ w: eff.a, h: eff.d, x: eff.e, y: eff.f });
  }
  return out;
}
