# PDFAirlock — Design Document

**One-liner:** A complete PDF toolkit (merge, split, compress, redact, sign, convert) that runs 100% in the browser. Files never leave the device — provably, verifiably, by design.

**Tagline:** *PDF tools that work with your wifi off.*

- **Status:** Phase 1 — **LIVE at https://pdfairlock.com** (2026-09-05)
- **Owner:** alphaNumericEntity (solo, nights & weekends)
- **Repo:** github.com/alphanumericentity/pdfairlock · AGPL-3.0 · deploys auto via Vercel on push
- **Domain:** `pdfairlock.com` — purchased 2026-09-04 (Cloudflare Registrar), apex primary, www 308→apex.

---

## 1. Problem & Opportunity

### The incumbent model is upload-first

Every mainstream free PDF tool (iLovePDF, Smallpdf, PDF24 online, Adobe's free tools, TinyWow) works the same way: the user uploads the file to the vendor's server, the server processes it, the user downloads the result. This is invisible to most consumers but a hard blocker for an enormous professional segment:

- **Lawyers** — privileged documents, court filings under protective orders
- **HR / People ops** — offer letters, salary data, disciplinary records, immigration docs
- **Healthcare admin** — anything touching PHI (HIPAA)
- **Accountants / financial advisors** — tax returns, statements
- **Government / defense adjacent** — anything on a restricted network

These users are contractually or legally forbidden from uploading client documents to a random third-party server. Today they either (a) risk it anyway, (b) pay ~$240/yr for Adobe Acrobat, or (c) email the file to a colleague who has Acrobat. Meanwhile the consumer segment has subscription fatigue: Smallpdf/iLovePDF want $7–12/month forever for what is fundamentally a local computation.

### Our position

WASM + mature JS PDF libraries make it possible to do all of this **inside the browser tab**. The server serves static files and nothing else — there is literally no endpoint that could receive a document. That turns the strongest objection to web tools (privacy) into our strongest claim, and enables:

- **One-time pricing** (no per-user server cost → no subscription needed)
- **A verifiable claim, not a policy promise** — "check the network tab; turn off your wifi; it still works." Incumbents ask for trust; we make trust unnecessary.
- **Offline use** — PWA works on a plane, in a SCIF-adjacent office, behind a hospital firewall.

### Why this is AI-proof (the hard requirement)

1. **The buyer's problem is confidentiality, not capability.** Pasting a privileged contract into ChatGPT *is the thing they are forbidden to do*. An AI chat interface is structurally the wrong shape for this job.
2. **The paid value is correctness + liability-shaped trust** (true redaction, verification report, a legitimate vendor with an invoice), not intelligence. Firms pay by policy; they cannot run "some agent" on confidential files.
3. **The moat vs. AI-accelerated cloners is distribution** — SEO pages, backlinks from privacy communities, reviews, brand trust — none of which AI compresses.

### Why now

- WASM/OffscreenCanvas/File System Access APIs are mature in all evergreen browsers.
- Subscription fatigue is a named consumer trend; one-time purchases are a differentiator again.
- E-signature / e-document volume keeps growing; document privacy incidents (and famous botched-redaction scandals) keep making news.

### Competitive landscape

| Competitor | Model | Weakness we exploit |
|---|---|---|
| iLovePDF / Smallpdf | Freemium sub, ~$9/mo | Uploads files to servers; subscription |
| Adobe Acrobat | $20+/mo | Price, bloat; overkill for occasional pro use |
| PDF24 (desktop) | Free, ad/brand supported | Windows-centric, dated UX, still "trust us" for online tools |
| Stirling PDF | Open-source, self-hosted | Requires Docker/self-hosting — normal people can't |
| TinyWow etc. | Free, ads | Uploads; ad-tech surveillance is the opposite of private |
| macOS Preview / print-to-PDF | Free, local | No redaction, no compression control, no batch, Mac-only |

Nobody owns the positioning "**local-only, verifiable, one-time price**." That's the gap.

---

## 2. Product Principles

1. **Files never leave the device.** No exceptions, no "just this one feature," no telemetry that includes document data. Any future feature that requires a server touch on document bytes is rejected by principle.
2. **Verifiable, not promised.** CSP forbids external connections; the app works offline; we teach users how to check.
3. **One-time price, no accounts.** License key, not login. localStorage, not database.
4. **Honest about limitations.** If compression rasterizes text, say so before the user runs it. If redaction has a caveat, print the caveat. Trust is the entire brand.
5. **Fast and boring.** No spinner theater. Web Workers keep the UI responsive; big files get progress bars.

## 3. Scope

### v1 tools (all implemented client-side)

| Tool | Route | Engine | Free/Pro |
|---|---|---|---|
| Merge PDFs | `/merge-pdf` | pdf-lib | Free |
| Split PDF | `/split-pdf` | pdf-lib (+zip) | Free |
| Extract pages | `/extract-pdf-pages` | pdf-lib | Free |
| Delete pages | `/delete-pdf-pages` | pdf-lib | Free |
| Rotate PDF | `/rotate-pdf` | pdf-lib | Free |
| Compress PDF | `/compress-pdf` | pdf.js render → JPEG rebuild (raster) or lossless clean | Free (basic) / Pro (batch) |
| **Redact PDF** | `/redact-pdf` | pdf.js text search + raster rebuild + verification | **Pro** (launch: free) |
| Sign PDF | `/sign-pdf` | canvas signature pad + pdf-lib | Free |
| Images → PDF | `/jpg-to-pdf` | pdf-lib | Free |
| PDF → Images | `/pdf-to-jpg` | pdf.js render (+zip) | Free |
| Watermark | `/watermark-pdf` | pdf-lib | Free |
| Page numbers | `/add-page-numbers` | pdf-lib | Free |
| Unlock (remove password) | `/unlock-pdf` | qpdf-wasm (ISC/Apache-2.0) | Free |
| Protect (AES-256) | `/protect-pdf` | qpdf-wasm | Free |

Batch mode (multiple files per run + zip-all download) ships on compress, rotate, watermark and page numbers — free during beta, Pro after launch.

### Non-goals for v1

- OCR — feasibility verified (tesseract.js 7 + `@tesseract.js-data/eng`, ~14MB self-hostable assets); deferred to its own build session because the searchable-PDF text overlay needs careful correctness work
- PDF/A conversion, form *creation*, cross-file text search
- Accounts, cloud storage, collaboration — never, by principle
- Editing text inside a PDF (deep well; Acrobat's actual moat)

## 4. The Redaction Wedge

The flagship feature and the reason a professional pays. Design matters here more than anywhere.

### Why naive redaction fails

Drawing a black rectangle *over* text leaves the text in the file — selectable, searchable, extractable. This exact failure has produced real legal scandals (court filings where journalists copy-pasted the "redacted" text out). Word-to-PDF metadata, embedded attachments, and XMP metadata are secondary leak channels.

### Our modes

- **Mode A — Rasterize (shipped, guaranteed):** redacted pages are re-rendered to flat images with black boxes burned in. Default is **mixed assembly**: only redacted pages are rebuilt; untouched pages are copied verbatim and keep their selectable text. A **flatten** option rebuilds every page for maximum assurance. Either way, the text layer on redacted pages *ceases to exist*. Tradeoffs (selectability, size) are stated in the UI.
- **Mode B — Surgical content-stream editing (Phase 2):** remove only the text-show operators and image regions intersecting redaction rects, preserving the rest of the text layer. Harder correctness surface (glyph runs, Type3 fonts, annotations, XFA); ships only with an exhaustive test corpus.

### Verification pass (the trust feature)

After producing output, we **re-open the output file and prove the redaction**:

1. Extract full text of every output page (pdf.js `getTextContent`) → redacted pages must have zero text; assert it.
2. Search the extracted text of *all* pages for each redacted term — if a searched name still appears on a page the user didn't box, the report names the page and tells them to add a box there.
3. Scan output bytes for the terms (heuristic tripwire; the extraction check is the strong guarantee).
4. Strip document metadata (Info dictionary + XMP) and report it.
5. Render the report: "✓ redacted pages contain zero extractable text · ✓ terms absent · ✓ metadata cleared."

No competitor shows their work. This report is screenshot-able, which is marketing.

### Legal posture

We are a tool, not counsel. UI carries a one-line disclaimer ("verify output before distribution"). Terms of service at purchase time disclaim liability (standard software warranty language). Never market "guaranteed compliant"; market "verifiable."

## 5. Architecture

```
┌─────────────────────────── Browser ────────────────────────────┐
│                                                                │
│  Next.js static UI (App Router, prerendered SEO pages)         │
│      │                                                         │
│      ├── Main thread: pdf.js (lazy-loaded)                     │
│      │     · page rendering/thumbnails (canvas)                │
│      │     · text extraction + search-term rect mapping        │
│      │     · pdf.js worker: /pdf.worker.min.mjs (self-hosted)  │
│      │                                                         │
│      └── Dedicated Worker (ops.worker.ts, hand-rolled RPC)     │
│            · pdf-lib: merge/split/extract/delete/rotate/       │
│              watermark/page-numbers/images→pdf/assemble        │
│            · fflate: zip packaging                             │
│            · transfers ArrayBuffers (zero-copy)                │
│                                                                │
│  State: React useState per tool. License: localStorage.        │
│  Files: ArrayBuffer in memory → Blob URL download.             │
└────────────────────────────────────────────────────────────────┘
                    ▲ static assets only (HTML/JS/CSS)
        Vercel (free tier) — no API routes, no functions, no DB
        CSP: connect-src 'self' → external calls are impossible
        Service worker → full offline PWA after first visit
```

### Key decisions

- **Next.js static export (`output: 'export'`), not Vite SPA.** The business is SEO; we need per-tool prerendered pages with real content, metadata, and JSON-LD. Next gives SSG + the app model with zero servers. All tool pages are server components for copy/SEO wrapping a `'use client'` tool component.
- **No backend at all in v1.** Not even analytics. `vercel.json` sets `connect-src 'self'` CSP — the privacy claim is enforced by the platform, not by our good behavior.
- **pdf-lib for structural ops** (pure JS, MIT, mature): merge/split/rotate/etc.
- **pdf.js for rendering + text** (Apache-2.0, Mozilla): previews, compression rasterization, redaction search/verify. Its worker file is copied into `public/` at postinstall — self-hosted, never a CDN.
- **No AGPL WASM in the bundle.** mupdf/Ghostscript would improve compression but AGPL contaminates a closed-source product. qpdf cleared the license review (`@neslinesli93/qpdf-wasm`, ISC wrapper over Apache-2.0 qpdf) and now powers the password tools via a second esbuild-built worker (`public/qpdf.worker.js` + self-hosted `qpdf.wasm`).
- **Hand-rolled worker RPC (~40 lines) instead of comlink.** One less dependency; full control over transferables and progress messages.
- **Engines are lazy-loaded** (`await import`) — keeps first paint fast on SEO landings and avoids SSR/prerender breakage (pdf.js touches browser globals).
- **Memory model:** whole-file ArrayBuffers in memory. Practical ceiling ~500MB–1GB depending on device; UI warns at 200MB. Streaming/chunked processing is a non-goal (PDF isn't stream-friendly for these ops).

### Privacy enforcement stack (what makes the claim true)

1. Static host — no endpoint exists that accepts a request body.
2. CSP `connect-src 'self'` (plus `object-src 'none'`, `frame-ancestors 'none'`) in `vercel.json`.
3. Zero third-party scripts, fonts, or pixels. System font stack. No analytics in v1.
4. Service worker caches the whole app → works with wifi off (the demo).
5. `/privacy` page documents how to verify all of the above in devtools.

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16, App Router, static export | SEO pages + React, zero servers |
| Language | TypeScript (strict) | Baseline |
| Styling | Tailwind CSS v4 | Speed; `@theme` tokens; no runtime CSS |
| PDF structure | pdf-lib | MIT, pure JS, does 80% of ops |
| PDF render/text | pdfjs-dist (v5) | The only serious JS renderer |
| Zip | fflate | Tiny, fast, sync API in worker |
| License crypto | @noble/ed25519 | 4KB, audited, WebCrypto-backed |
| Tests | Vitest | Fast, no config drama |
| Lint/format | Biome | One tool, fast |
| Host | Vercel free tier | Static export = $0 at any traffic that matters pre-launch |
| Payments (Phase 2) | Lemon Squeezy | Merchant of record (handles EU VAT etc.), license key API |

## 7. Licence

AGPL-3.0. Run it, read it, fork it, self-host it. If you run a modified version as a
network service, that version's source has to be available too — which is the same
argument the product makes: a privacy claim you cannot inspect is not a claim.

Pricing, commercial licensing and go-to-market planning are tracked outside this
repository. Everything in the app is free while it is in beta, and the pricing page says
so rather than teasing tiers.

## 8. Testing Strategy

- **Unit (Vitest, in repo):** pure ops via pdf-lib against generated fixtures (merge counts, split/extract/delete correctness, rotation normalization, range parser edge cases); license sign/verify roundtrip + tamper rejection. Runs in CI-less `pnpm test` for now.
- **Redaction corpus (seeded, in repo):** `tests/redaction.test.ts` runs the real raster→assemble→verify pipeline headless (pdf.js legacy + @napi-rs/canvas) against a fixture with a planted secret: asserts the output has zero extractable text, the secret is absent from output bytes, metadata is stripped, and page geometry survives — plus positive/negative controls proving the detectors work. Grow this corpus with every redaction bug ever found.
- **In-browser verification (product feature doubling as test):** the redaction verifier is itself an assertion executed on every real user run.
- **Playwright e2e (shipped, `pnpm test:e2e`, 30 specs):** real Chromium against the built static export. Full flows for every tool (upload → operate → download → verify the artifact), including: search-driven redaction with a pixel assertion that the burned box lands exactly on the searched term; signature placement verified against the clicked position via content-stream matrix decomposition; protect→unlock UI roundtrip with real AES; batch + zip-all; error paths (fake PDF, encrypted PDF pointing at Unlock, wrong password, mismatched confirm); the offline test (first visit → airplane mode → reload → merge still works, via the build-time precache manifest); zero-external-requests proof; pricing-page free-beta regression (no `$` amounts, no license UI); SEO structure over all 14 tool pages (canonical + FAQ JSON-LD); sitemap completeness; dark/light palette. PDF text/pixel inspection runs in child Node processes (`e2e/inspect-text.ts`, `e2e/verify-output.ts`) because pdf.js rendering through @napi-rs/canvas segfaults inside Playwright's worker.
- **Beware `textContent` in specs:** Next's RSC payload inside `<script>` tags is full of `"$1"`-style refs that false-match price regexes — use `innerText` (rendered text) for content assertions.
- **Not tested by design:** pdf.js rendering fidelity (upstream's job), exotic malformed PDFs (fail with honest error messages).

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Redaction bug ships a secret | Brand-fatal | Rasterize mode is structurally safe; verification pass; corpus tests before Mode B; disclaimer |
| Huge files OOM the tab | Support noise | 200MB soft warning, honest error, document ceiling |
| Browser API drift (OffscreenCanvas, FS Access) | Feature breakage | Feature-detect + fallbacks (plain download path always works) |
| Incumbent copies positioning | Growth ceiling | They can't: upload-processing is their architecture & cost model; our moat is the claim they can't make |
| AGPL contamination via WASM deps | Legal | License review gate in decision log; MIT/Apache only |
| SEO takes >12 months | Motivation death | Launch spikes and direct outreach don't depend on Google |
| Chargebacks/VAT complexity | Ops time | Lemon Squeezy is merchant of record |

## 10. Roadmap

- **Phase 0 — Build (Aug 2026): ✅ done.** 14 tools (incl. qpdf password tools), redaction Mode A with mixed assembly + per-term verifier, batch mode + zip-all, dark mode, PWA (offline SW + PNG icons), two SEO content pages, license verifier, unit + Playwright e2e suites.
- **Phase 1 — Launch (Sep–Oct 2026):** domain ✅ · deploy ✅ (Vercel static mode) · Search Console ✅ · CI ✅ · technical docs ✅ · demo recording automated ✅. Remaining: more comparison content, terms page.
- **Phase 2 — Monetize (Q4 2026):** Lemon Squeezy live, flip Pro gate (redaction verification + batch), gated pro bundle function, B2B outreach.
- **Phase 3 — Deepen (2027):** redaction Mode B + corpus, OCR (tesseract.js 7 — feasibility verified, needs its own session), Tauri desktop build for air-gapped users, i18n (DE/FR).

## 11. Decision Log

- **2026-08-02** — Name "AirgapPDF" adopted as working title; domain/trademark check deferred to Phase 1.
- **2026-09-15 (later)** — Ranking plan, executed in the order that earns links first. (1) Shipped `/pdf-redaction-checker`: a read-only inspector for already-redacted PDFs. The query "how to check if a PDF is properly redacted" is served entirely by tiny sites, we already had the verifier, and a checker reinforces the flagship. Detection is pixel-based: each text run is tested against the rendered page, and a run (or the covered part of it, expanded to word boundaries) counts as hidden only when the pixels under it are ≥97% dark — a plain "text overlaps a dark rectangle" rule would flag visible white-on-black headings. Also reports unapplied `Redact` annotations, surviving terms (text layer + raw bytes) and identifying metadata. (2) IndexNow: `pnpm indexnow` after every content deploy; first submission 35 URLs, HTTP 202. Bing and Brave had zero pages indexed. (3) Guides linked from the home page and nav so the new pages inherit the home page's authority. (4) In progress: a reproducible test of 14 online PDF mergers (`scripts/upload-test.mjs` — same synthetic files, every request body logged, then repeated with the network cut) for a "which tools actually upload your file" article; no such test exists in the results for that query.
- **2026-09-15** — SEO reality check, ten days after launch. Bing and Brave index zero pages of pdfairlock.com; Google's count is unverified (GSC is the only source). The test query, "update pdf without upload", is not the phrasing people rank for: engines read "update" ambiguously (Bing returns Windows Update). The real cluster is "edit pdf without uploading" plus per-tool "merge/redact/sign pdf without uploading", and the sites that rank there are small (BentoPDF, LocalPDF, HonestPDF, ihatepdf, a dozen others), so it is winnable. What they all do and we didn't: the H1 literally contains "without uploading"; tool pages run 1,000–1,600 words with a how-to step list, use cases and ~8 FAQs; and each site has a run of ~1,400-word "How to X without uploading it" guides linking into the tools. Shipped the same shape: every tool page now has an H1 with the phrase, HowTo JSON-LD steps, use cases, notes, a three-check "test us" section and expanded FAQs (750–960 words each, from 340–475); four guides (edit hub, merge, redact, sign) with FAQ schema; the blog index groups guides and engineering notes. Deliberately not done: an "edit PDF" tool page for a feature we don't have — the edit guide says so honestly and points at LibreOffice Draw. The lesson, written down: model an SEO page on the pages that currently rank for the query, never on an assumption about what should rank.
- **2026-09-10** — Automating the demo GIF (`pnpm demo`, Playwright driving production with the context genuinely offline) exposed a real leak in the flagship feature: search-driven redaction boxes were positioned by *character-count fraction* of a pdf.js text item, which left 3.5–10pt (up to 1.5 glyphs) of a mid-line SSN or name uncovered — the demo showed a visible "0" outside the box. Fixed by measuring substring widths with canvas `measureText` against the font face pdf.js actually loaded (forced with `page.getOperatorList()`, exposed via `fontExtraProperties`), scaled to the item's true width, plus 0.2em padding; measured error ≤0.35pt for embedded and standard-14 fonts. Two lessons written down: (1) the verifier proves the *text layer* is gone, not that the *pixels* were covered — geometry bugs are invisible to it, so `e2e/redact-geometry.spec.ts` now pins box positions against font-metric ground truth and checks the burned pixels; (2) pdf-lib's `widthOfTextAtSize` applies AFM kerning that its `drawText` never emits — ground truth for unkerned `Tj` text is the per-glyph sum.
- **2026-09-06** — Site fully live and verified end-to-end: pdfairlock.com serving (apex primary, www 308), full e2e suite green against the production domain itself, Search Console verified + sitemap submitted (19/19 pages), Safari airplane-mode test passed on real hardware. Technical doc suite (docs/) written. Instrumentation decision reaffirmed: server-side counts + Search Console only — no client analytics without a deliberate copy-change decision.
- **2026-09-05** — First production deploy (Vercel, pdfairlock.vercel.app) + live e2e run found two defects local testing structurally cannot catch: (1) Vercel invokes `next build` directly, skipping pre/post lifecycle scripts — the precache manifest never generated; fixed with `buildCommand: "pnpm run build"` in vercel.json. (2) Our CSP blocked WebAssembly compilation in Chrome (password tools dead on live; local server sends no CSP headers) — fixed by adding `'wasm-unsafe-eval'` to script-src. Standing rule: every deploy-affecting change gets a live e2e run (`PLAYWRIGHT_BASE_URL=<url> playwright test`).
- **2026-09-04** — Renamed to **PDFAirlock**; `pdfairlock.com` purchased. "AirgapPDF" died twice over: a same-category Android app ("AirGap: PDF & Image Tools") predated us, and a third party registered airgappdf.com on 08-20 and shipped a competing site under the name. Collision searches on PDFAirlock came back clean (08-11 and 09-04). Lesson: this niche mints names in days — never sit on an unregistered name.
- **2026-08-02** — No backend, no analytics in v1; CSP-enforced. Revisit privacy-respecting counts only if launch decisions require data.
- **2026-08-02** — Redaction ships rasterize-first (correctness over fidelity); surgical mode gated on test corpus.
- **2026-08-02** — Launch free, gate later. Traffic before revenue.
- **2026-08-02** — comlink rejected (hand-rolled RPC); AGPL WASM rejected; Next.js chosen over Vite for SEO SSG.
- **2026-08-02** — One-time pricing, Lemon Squeezy as MoR, Sublime-style light enforcement.
- **2026-08-04** — Turbopack cannot bundle `new Worker(new URL(...))` in static export (emitted the raw `.ts` as an asset); workers are prebuilt with esbuild into `public/` instead. Never rely on bundler worker magic here.
- **2026-08-04** — qpdf adopted after license check (ISC wrapper / Apache-2.0 core): unlock + protect tools ship in a second worker. Error mapping uses context + exit codes, not log parsing (qpdf's wasm build writes errors past the printErr hook).
- **2026-08-04** — Redaction defaults to mixed assembly (only redacted pages rasterized); flatten remains as the maximum-assurance option. Verifier reports per-term page hits so a missed occurrence is actionable.
- **2026-08-04** — Dark mode via scheme-aware CSS vars; the used zinc/amber/red Tailwind palette names are remapped in `@theme inline` (see globals.css) so components stay literal-free of theme logic.
- **2026-08-04** — OCR deferred with feasibility verified (tesseract.js 7 + eng data package, self-hostable); it gets a dedicated session for the searchable-text-overlay correctness work.
- **2026-08-06** — Beta is a clean demand experiment: everything free, zero payment signaling in the product. Pricing page reduced to "free during beta + one-time-never-subscription promise"; no prices, no tiers, no license entry (component kept for later), no Pro markers on features. Rationale: measure traffic and SEO honestly before committing to payments and tax setup.
- **2026-08-06** — Service worker switched from cache-first to stale-while-revalidate (cache-first froze content updates for returning visitors forever); offline behavior unchanged.
- **2026-08-09** — Writing the offline e2e exposed that runtime-only caching broke the wifi-off promise on first visit (workers/chunks/HTML not cached until requested). Fixed with a build-time precache manifest (`scripts/gen-precache.mjs` → ~5MB, everything except the optional pdfjs cmaps/fonts), loaded by the SW at install (v5).
- **2026-08-09** — Pre-deploy QA pass: e2e now runs on chromium + firefox + webkit (98 pass, 1 webkit-only skip: Playwright WebKit can't emulate SW+offline — verify in real Safari post-deploy). Visual review across themes/viewports fixed the cramped mobile header nav; realworld unit suite added (scanned/image PDFs, 120-page perf, annotation preservation on untouched pages + zero annotations on replaced pages). Raw-mouse specs must keep their drag/click targets inside the viewport (taller test viewport) — scrollIntoViewIfNeeded centers differently per engine.
