# PDFAirlock

**Live: https://pdfairlock.com** — a PDF toolkit that runs entirely in your browser. Merge,
split, compress, redact, sign, password-protect and convert, with no upload step anywhere in
the product.

The claim is not "we delete your files quickly". It is that there is nowhere to upload them
to: the site is static files plus your own browser, and the response headers forbid the page
from talking to any other host.

## Check the claim instead of believing it

1. **Watch the network.** Open devtools on the Network tab and run any tool. No request
   carries your document, and once the app is cached there are no requests at all.
2. **Pull the plug.** Load a tool page, turn off your wifi, then use it. Everything still
   works, because a service worker precaches the whole app on the first visit.
3. **Read the headers.** `vercel.json` ships a Content-Security-Policy with
   `connect-src 'self'`, so the browser itself refuses to send anything to another origin,
   whatever the code asks for.

The third one is the interesting one: it means the guarantee does not depend on trusting
this repository to stay honest.

## The tools

Fifteen of them: merge, split, extract pages, delete pages, rotate, compress, redact,
redaction checker, sign, unlock, protect, JPG→PDF, PDF→JPG, watermark, page numbers.

Two are worth singling out. **Redact** destroys text rather than covering it: marked pages
are rebuilt as images, then the output is re-opened and verified, and you get a report
saying what the verifier could and could not prove. **Redaction checker** does that to
someone else's file, finding text that is still sitting under a black rectangle.

## Quickstart

```sh
pnpm install        # also copies pdf.js/qpdf assets + builds the workers into public/
pnpm dev            # http://localhost:3000
pnpm build          # static export → out/
pnpm test           # vitest: ops, ranges, redaction corpus, qpdf, geometry
pnpm test:e2e       # playwright against the built export (run pnpm build first)
pnpm check          # biome lint + format
```

`PLAYWRIGHT_BASE_URL=https://example.com pnpm test:e2e` points the same specs at a deployed
copy. That is how this project tests production, because the two bugs that cost the most
were both invisible locally: a CSP that blocked WebAssembly compilation, and a build
pipeline that dropped the service worker's precache manifest.

## Layout

```
src/app/                  routes: landing, /[tool] (15 pages), /blog, /compare, /privacy, /pricing
src/components/           shell UI + per-tool client components (components/tools/*)
src/lib/pdf/              pdf-lib ops, pdf.js helpers, compress, redact + verifier, qpdf core
src/lib/worker/           two esbuild-prebuilt workers (ops+zip, qpdf) and the RPC client
scripts/                  asset copy (postinstall), worker builds, icons, precache, demo recorder
tests/                    vitest: 78 unit tests including a redaction corpus with controls
e2e/                      playwright: 38 specs, pixel-verified redaction, an offline proof,
                          and one that asserts zero non-origin requests during a real job
```

How it works in detail: [ARCHITECTURE](./docs/ARCHITECTURE.md) (engine choices, the worker
split, why the workers are prebuilt) · [REDACTION](./docs/REDACTION.md) (what the verifier
proves, and what it cannot) · [PRIVACY-MODEL](./docs/PRIVACY-MODEL.md) (enforcement layers
and the threat-model boundary) · [TESTING](./docs/TESTING.md) (the verification machinery) ·
[DESIGN](./DESIGN.md) (product rationale and a dated decision log, including the mistakes).

## Rules of the codebase

- **Nothing may send document bytes anywhere.** The CSP in `vercel.json` enforces
  `connect-src 'self'`. A change that loosens it is a change to the product's only promise.
- No third-party scripts, fonts or analytics. System fonts only, and no telemetry of any
  kind.
- Engines (`pdf-lib`, `pdfjs-dist`, the qpdf WASM build) load lazily in the client. Never
  import them from a server component.
- Comments are a last resort. If a line needs explaining, the explanation usually belongs in
  a better name or in the docs above.

## Contributing

Issues and pull requests are welcome, especially bug reports with a PDF that breaks
something. Two things will get a change rejected regardless of how good it is: weakening the
no-upload guarantee, and adding a dependency that phones home.

New behaviour needs a test. The redaction tests in particular use a corpus with planted
secrets and negative controls, because the failure mode that matters is a box in the wrong
place, which the text-layer verifier cannot see on its own.

## Licence

[AGPL-3.0](./LICENSE). Run it, read it, fork it, self-host it. If you run a modified version
as a network service, that version's source has to be available too, which is the same
argument the product makes: a privacy claim nobody can inspect is not a claim.
