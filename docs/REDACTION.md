# Redaction — the deep dive

The flagship feature, and the one where a bug would be brand-fatal. This documents how it
works, why it works that way, and the exact boundaries of what the verifier proves.

## Why "draw a black box" tools keep leaking

A PDF page is a program: a content stream of drawing operators. Text is not pixels — it's
`Tj`/`TJ` operators referencing font glyphs. Drawing a black rectangle adds a *new* operator
on top; the text operators remain in the file, one select-all-copy-paste away. Court filings
have been unredacted exactly this way. Secondary leak channels: document metadata (Info
dictionary + XMP), and annotations.

The only safe mental model: **redaction is destruction, not concealment.**

## Mode A: rasterize with mixed assembly (shipped)

Pipeline (`src/lib/pdf/redact.ts` + worker ops in `src/lib/pdf/ops.ts`):

1. **Marking.** Two inputs produce normalized boxes (`{page, x, y, w, h}` as 0–1 fractions
   of the page, so they're independent of render scale):
   - *Search*: pdf.js `getTextContent()` returns text items with transform matrices. For
     each match we map the item into viewport space (`Util.transform`), take the baseline
     from the matrix and font height from `hypot(m[2], m[3])`. The substring's horizontal
     extent is measured with canvas `measureText` (kerning off) using the font face pdf.js
     loaded for that item — forced via `page.getOperatorList()` and exposed through
     `fontExtraProperties` (`fontSubstitutionLoadedName` for the standard-14 substitutes) —
     and scaled to the item's true width, the way pdf.js's own text layer positions runs.
     Measured against font-metric ground truth this is within 0.35pt for embedded and
     standard fonts; the earlier character-count approximation left up to 10pt (1.5 glyphs)
     of a match exposed mid-line. Every box gets 0.2em of padding on each side — over-cover
     the neighbouring space, never under-cover a glyph. Vertically the box spans 1em above
     the baseline to the font's own descent (from `getTextContent().styles`, floor 0.25em)
     plus 0.05em below it. `getOperatorList()` resolves before the faces finish loading, so
     the code also awaits `document.fonts.ready` before measuring. Residual sources of error: `Tc`/`Tw`
     spacing inside an item (distributed proportionally, not per gap) and matches split
     across items (below). `e2e/redact-geometry.spec.ts` pins the geometry against
     ground truth and checks the burned pixels.
   - *Manual drag*: pointer events on an overlay div positioned over the rendered page.
     Required for scanned documents, which have no text layer (until OCR ships).
2. **Burning.** Each *marked* page is rendered by pdf.js at 2× scale to a canvas, the boxes
   are filled with opaque black (with a 1px safety pad), and the canvas is encoded to JPEG.
3. **Mixed assembly** (the default; `assembleMixed`). A fresh `PDFDocument` is built:
   marked pages become image-only pages at the original dimensions; *unmarked* pages are
   `copyPages`'d from the source verbatim, keeping their selectable text and annotations. A
   **flatten** option instead rebuilds every page as an image for maximum assurance.
4. **Metadata strip.** Title/Author/Subject/Keywords/Producer/Creator emptied and the XMP
   metadata object deleted from the catalog.

Why this is safe by construction: an image-only page contains **no text operators at all**.
There is nothing to extract, select, or search on that page — the failure mode of overlay
tools is structurally impossible, not merely avoided.

Consequences we state in the UI rather than hide: redacted pages lose selectable text (like
a scan) and may grow in size; a replaced page carries zero annotations from the original
(link annotations on a redacted page are themselves a leak channel — dropping them is
correct, and tested).

## The verification report

After producing output, the app treats **its own output as untrusted** and audits it
(`verifyRedaction` → pure `buildReport`):

1. **Re-extraction.** The output is re-opened and every page's text extracted. Marked pages
   must yield zero text. This is the strong guarantee: for a rasterized page, extraction
   returning nothing means there is nothing.
2. **Per-term sweep.** Every searched term is looked for in the extracted text of *all*
   pages. If "Jane Doe" survives on page 3 because the user removed that box (or a new
   occurrence exists), the report names page 3 and says to add a box there — an actionable
   failure, not a red X.
3. **Byte-scan tripwire.** The raw output bytes are scanned (latin1) for each term. This is
   deliberately labeled a tripwire, not a proof: it catches plaintext remnants but cannot
   see inside compressed streams and misses non-latin1 encodings (pdf-lib writes metadata
   as UTF-16, which is exactly why the *extraction* check is primary). A hit here with no
   text hit recommends flatten mode.
4. **Metadata confirmation.**

`ok` requires all three clean. The report renders in the UI — screenshot-able, which for the
target user ("are you SURE it's gone?") is the product.

## Known limitations, stated on purpose

- **Scanned documents**: no text layer → search finds nothing; the UI says so and points to
  manual boxes. Client-side OCR (tesseract.js, self-hosted) is roadmap.
- **Search matches within a single text item**: a term split across pdf.js items (unusual
  kerning/spans) may not auto-match — manual boxes cover it; a cross-item matcher is a
  planned improvement.
- **Rotated or vertical text runs**: search boxes assume a horizontal baseline (the box is
  laid out along the page x-axis from the item's origin). A match inside rotated text gets a
  wrong box — draw it manually and review the preview.
- **The byte-scan's latin1 blindness** (above) — by design a secondary signal.
- **We tell users to review the output anyway.** The verifier exists so nobody has to take
  our word; that includes not asking them to take the verifier's word as the final step for
  documents with legal stakes.

## Mode B: surgical content-stream editing (not shipped)

The Acrobat-style version: rewrite the content stream removing only the text-show operators
and image regions intersecting the boxes, preserving selectable text elsewhere *on the same
page*. The correctness surface is much larger — partial glyph runs, Type3 fonts, inline
images, annotations, XFA — and a subtle miss leaks someone's name. It ships only behind an
exhaustive test corpus (real-world PDFs with planted secrets, per TESTING.md), and until
then rasterize-with-mixed-assembly covers the actual need: guaranteed destruction with
minimal collateral.
