# Architecture — how PDFAirlock actually works

Companion docs: [REDACTION.md](./REDACTION.md) (the flagship feature),
[PRIVACY-MODEL.md](./PRIVACY-MODEL.md) (threat model), [TESTING.md](./TESTING.md)
(how we know it works), [../DESIGN.md](../DESIGN.md) (product rationale + dated decision log).

## The one-sentence version

PDFAirlock is a static website whose pages are real programs: the browser downloads the
toolkit once, and every PDF operation afterwards happens in the user's own tab — the server
cannot receive a document because no code path, endpoint, or permission for that exists.

## System diagram

```
┌────────────────────────────── Browser ───────────────────────────────┐
│                                                                      │
│  Next.js static pages (prerendered HTML per tool — the SEO layer)    │
│      │                                                               │
│      ├── Main thread                                                 │
│      │     · React tool UIs (file pickers, options, progress)        │
│      │     · pdf.js (lazy-loaded): page rendering, text extraction,  │
│      │       search-term → rectangle mapping                         │
│      │       └── its own worker: /pdf.worker.min.mjs (1.2MB)         │
│      │                                                               │
│      ├── ops worker  /ops.worker.js (436KB, esbuild-prebuilt)        │
│      │     · pdf-lib: merge/split/extract/delete/rotate/watermark/   │
│      │       page-numbers/images→pdf/signature placement/assembly    │
│      │     · fflate: zip packaging                                   │
│      │                                                               │
│      └── qpdf worker /qpdf.worker.js (44KB glue + /qpdf.wasm 1.3MB)  │
│            · real qpdf compiled to WASM: AES-256 protect, unlock     │
│                                                                      │
│  Service worker /sw.js: full-app precache → works offline            │
│  State: React useState per tool. Files: ArrayBuffers in memory.      │
└──────────────────────────────────────────────────────────────────────┘
                    ▲ static files only
     Vercel, static mode (framework:null, serves out/ verbatim)
     CSP header: connect-src 'self' → external requests are impossible
```

## Life of an operation (merge, as the simple case)

1. The user drops files → `File` objects → `arrayBuffer()` → `Uint8Array`s on the main thread.
2. The UI posts `{id, op: "mergePdfs", args}` to the ops worker over a ~50-line hand-rolled
   RPC (`src/lib/worker/client.ts`). Inputs are structured-cloned; the worker streams
   `{id, progress}` messages back for the progress bar.
3. pdf-lib parses each document, copies pages into a fresh `PDFDocument`, serializes.
4. The result `Uint8Array` returns with its buffer in the postMessage **transfer list** —
   zero-copy back to the main thread.
5. The main thread wraps it in a `Blob`, creates an object URL, clicks an invisible `<a download>`.
   The bytes never existed anywhere but the user's RAM.

Rendering-heavy flows (compress, redact, PDF→JPG) differ in step 2–3: pdf.js renders pages
to canvases on the main thread (yielding to the event loop between pages), the canvases are
encoded to JPEG, and the ops worker assembles the output PDF from those images.

## Why two custom workers, and why they're prebuilt

Heavy parsing must leave the main thread or the UI janks on big files. The natural modern
pattern — `new Worker(new URL("./worker.ts", import.meta.url))` and let the bundler handle
it — **silently failed under Turbopack's static export**: it emitted the raw TypeScript file
as an asset and the client tried to execute `.ts` in the browser. The build was green; every
tool was broken. (Caught by verification, not by the compiler — see TESTING.md.)

So workers are compiled by esbuild directly (`scripts/build-worker.mjs`, runs on install and
before every build) into plain files in `public/`. No bundler magic, identical behavior in
dev/CI/prod, and the worker is an inspectable artifact. The pdf.js worker and qpdf's WASM are
similarly copied out of `node_modules` into `public/` at install — **everything is
self-hosted**; a CDN request wouldn't just be a privacy smell, the CSP would block it.

## Engine choices (and what was rejected)

| Need | Choice | Rejected | Why |
|---|---|---|---|
| Structural ops | pdf-lib (MIT, pure JS) | — | Does 80% of operations; runs anywhere including tests |
| Render + text | pdfjs-dist (Apache-2.0) | — | The only serious JS renderer; powers Firefox |
| Encryption | qpdf → WASM (`@neslinesli93/qpdf-wasm`, ISC wrapper) | mupdf, Ghostscript | The rejected ones are AGPL — contaminating for a closed product. qpdf is the professional standard and permissively licensed |
| Zip | fflate | JSZip | Tiny, fast, synchronous inside a worker |
| Worker RPC | ~50 lines hand-rolled | comlink | One fewer dependency; explicit control of transferables and progress messages |
| Framework | Next.js static export | Vite SPA | The business is SEO: 19 prerendered pages with per-tool titles, FAQ JSON-LD, sitemap. A SPA renders nothing for a crawler |
| License keys | Ed25519 (`@noble/ed25519`) | server validation | Keys verify offline against an embedded public key; air-gapped buyers stay first-class |

qpdf error handling is deliberately not log-based: its WASM build writes errors past the
`printErr` hook, so failures are classified from exit codes plus context (an `/Encrypt`
sniff on the input distinguishes "not encrypted" from "wrong password").

## The offline system

The service worker (`public/sw.js`) uses **stale-while-revalidate** (serve cache instantly,
refresh in the background — offline stays instant, content updates land next visit) plus a
**build-time precache manifest**: `scripts/gen-precache.mjs` walks the final `out/`
directory after every build and emits the full asset list (~186 URLs, ~5MB — every page,
chunk, worker, and wasm; only pdf.js's optional CJK cmaps/fonts stay lazy). The SW fetches
that list at install, so the *first* visit is enough for the whole toolkit to work in
airplane mode.

It ships as a manifest rather than being inlined because the chunk filenames are
content-hashed — unknowable before the build finishes.

## Deployment

Vercel in **plain static mode** (`vercel.json`: `framework: null`,
`outputDirectory: "out"`, `cleanUrls: true`, `buildCommand: "pnpm run build"`). Two
production-only lessons forced this, both caught by running the e2e suite against the live
deploy (TESTING.md):

1. Vercel's Next.js builder reconstructs deployments from `.next/` and ignores files added
   to `out/` afterwards — the precache manifest 404'd in production while existing locally.
2. Vercel invokes `next build` directly, skipping npm pre/post lifecycle scripts.

Static mode makes production semantics identical to the local test server: what `out/`
contains is exactly what ships. Headers (CSP and friends) come from `vercel.json` and apply
per-response. Deploys are git-push-triggered.

## Constraints accepted on purpose

- **Whole-file memory model.** Documents live as ArrayBuffers; practical ceiling is device
  RAM (a few hundred MB is comfortable on laptops). PDF's structure makes true streaming for
  these operations a poor trade; the UI warns at 200MB instead of failing silently.
- **No accounts, no database, no analytics.** Not minimalism — enforcement surface. Every
  feature must survive the question "does this still work with wifi off?"
- **Rasterize-first redaction.** Correctness over fidelity; the surgical mode ships only
  behind an exhaustive corpus (REDACTION.md).
