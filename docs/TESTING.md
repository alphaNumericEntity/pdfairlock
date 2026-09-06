# Testing — how we know it works

104 automated tests in two layers (71 Vitest + 33 Playwright specs), run across three
browser engines locally and — the part that has mattered most — against the production
deployment itself. This doc covers what each layer proves, the machinery quirks worth
knowing, and the production bugs only live verification caught.

## Layer 1: Vitest (`pnpm test`, ~1s)

Real engines against generated fixtures, no mocks:

- **Redaction corpus** (`tests/redaction.test.ts`) — the crown jewel. Plants
  `SECRET-ALPHA-12345` in a fixture, runs the real raster→assemble pipeline headless
  (pdf.js legacy build + @napi-rs/canvas), and asserts: redacted page has zero extractable
  text, untouched page keeps its text (mixed mode), the secret is absent from output bytes,
  metadata stripped, page geometry preserved. Crucially it carries **controls**: a positive
  control (the detectors DO find the planted secret beforehand) and a negative control (a
  plain resave does NOT remove it) — proving the test can fail, which is what makes its
  passing meaningful. Every future redaction bug gets a case here; this file is the seed of
  the Mode-B corpus.
- **Signature placement by matrix decomposition** (`tests/pdf-inspect.ts` +
  `tests/ops-more.test.ts`). Rather than pixel-diffing, we inflate the output page's content
  stream and compose its `cm` transform matrices to recover exactly where and how large the
  signature was drawn, asserted against the placement math for multiple positions and
  pages. Gotcha encoded there: pdf-lib emits **four separate** `cm` operators
  (translate/rotate/scale/skew) — naive parsing reads the identity skew and everything looks
  like a 1×1 image at the origin.
- **qpdf roundtrips** — protect→unlock with assertions that the intermediate file is
  *really* AES-encrypted; wrong-password, no-password, not-encrypted, and symbol-laden
  password cases.
- **Realworld shapes** (`tests/realworld.test.ts`) — scanned (image-based) documents through
  the ops, a 120-page document under a time budget, and annotation behavior: links preserved
  on untouched pages, zero annotations surviving on a replaced page (a security property).
- Plus ops edge cases, range-parser fuzzing-lite, license sign/verify with tamper cases,
  report-verdict matrix.

## Layer 2: Playwright (`pnpm test:e2e`, ~30s)

Real Chromium/Firefox/WebKit against the built static export via a clean-URL static server
(`scripts/serve-out.mjs`) — or against any live URL:

```
PLAYWRIGHT_BASE_URL=https://pdfairlock.com pnpm exec playwright test --project=chromium
```

Every tool has a full flow: real file inputs (buffers, no temp files), real clicks, real
downloads, then the *artifact* is verified — page counts via pdf-lib, extracted text, zip
contents, rotation angles. Highlights:

- **Redaction, pixel-verified**: search a term through the actual UI, redact, download, then
  measure the luminance of the exact region where the term sat — asserted ~0 (pure black),
  with a bright control region on the same page proving the sampler works.
- **The privacy claim as a spec**: process a file while recording every network request;
  assert zero non-origin requests.
- **The wifi-off demo as a spec**: first visit → wait for the service worker → go offline →
  reload → merge PDFs successfully.
- Batch + zip-all contents, protect→unlock UI roundtrip, error paths (fake PDF, encrypted
  input pointing at the Unlock tool, wrong password, mismatched confirm), manual box
  drawing/removal, page navigation, pricing-page regression (no `$` amounts may reappear),
  SEO structure on all 14 tool pages, sitemap completeness, dark/light palettes.

## Machinery quirks (learned the hard way, kept so they're not relearned)

- **pdf.js render through @napi-rs/canvas segfaults inside Playwright's worker process**
  (and when rendering JPEG-embedded pages, even in plain Node). All post-download inspection
  that needs pdf.js runs in **child Node processes** (`e2e/inspect-text.ts`,
  `e2e/verify-output.ts`); pixel checks on our raster output decode the embedded JPEG via
  pdf-lib + canvas instead of rendering the PDF.
- **`textContent` lies in specs**: Next's RSC payload inside `<script>` tags is full of
  `"$1"`-style refs that false-match price regexes. Use `innerText` (rendered text).
- **Raw mouse APIs don't auto-scroll**: `page.mouse.*` coordinates must be inside the
  viewport; `scrollIntoViewIfNeeded` centers differently per engine. Drag/draw specs use a
  tall viewport and wait for the canvas to be sized before interacting.
- **Playwright's WebKit can't emulate service-worker-plus-offline** — that one spec skips on
  WebKit and was verified manually in real Safari.
- **SW install over the network is slow under parallel load** (~5MB precache while other
  workers saturate the host) — the offline spec allows 60s for the controller.

## Why we run the suite against production (and what it caught)

Local testing exercises our code; production testing exercises our code **plus the
platform**. The first-ever live run (28/33) found two ship-blocking bugs that were
structurally invisible locally:

1. **Our own CSP killed WebAssembly.** Chrome requires `'wasm-unsafe-eval'` in `script-src`
   to compile WASM when a CSP is set. The local test server sends no headers, so the
   password tools worked in every local run and were dead in production.
2. **Vercel's Next builder ignored post-build files.** The precache manifest was generated
   into `out/` by a `postbuild` script; Vercel reconstructs deployments from `.next/` and
   also invokes `next build` directly (skipping lifecycle scripts). Production 404'd the
   manifest; first-visit-offline silently degraded. Fix: static-mode deployment
   (`framework: null`, serve `out/` verbatim) — which also collapsed the difference between
   production and the local test server to zero.

Standing rule (also in DESIGN.md's decision log): every deploy-affecting change gets a live
e2e run before it's called done.

## What is deliberately not covered

pdf.js rendering *fidelity* (upstream's job), exotic malformed PDFs beyond honest error
messages, compress quality on real scan corpora (needs a corpus, planned), and Mode-B
surgical redaction (gated on building that corpus first).
