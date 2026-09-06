# PDFAirlock

PDF tools that work with your wifi off. Merge, split, compress, redact, sign, convert — 100% in your browser. Files never leave your device.

**Read [DESIGN.md](./DESIGN.md) first** — product rationale, monetization, GTM, roadmap, dated decision log.

Technical deep-dives in `docs/`: [ARCHITECTURE](./docs/ARCHITECTURE.md) (how it works, engine choices) · [REDACTION](./docs/REDACTION.md) (the flagship, exactly what the verifier proves) · [PRIVACY-MODEL](./docs/PRIVACY-MODEL.md) (the claim, enforcement layers, threat-model boundaries) · [TESTING](./docs/TESTING.md) (the 104-test verification machinery and what production runs caught) · [LAUNCH](./docs/LAUNCH.md) (launch kit).

## Quickstart

```sh
pnpm install        # also copies pdf.js/qpdf assets + builds workers into public/
pnpm dev            # http://localhost:3000
pnpm build          # static export → out/
pnpm test           # vitest unit tests (incl. headless redaction corpus)
pnpm test:e2e       # playwright against the built export (run pnpm build first)
pnpm check          # biome lint+format check
pnpm check-types    # tsc --noEmit
```

## Layout

```
src/app/                  routes: landing, /[tool] (14 SEO pages), /pricing, /privacy, content pages
src/components/           shell UI + per-tool client components (components/tools/*)
src/lib/pdf/              pdf-lib ops, pdf.js helpers, compress, redact + verifier, qpdf core
src/lib/worker/           two esbuild-prebuilt workers (ops+zip, qpdf) and RPC client factory
src/lib/license/          ed25519 license key verification
scripts/                  keygen, asset copy (postinstall), worker builds, icons, e2e static server
tests/                    vitest: ops, ranges, license, qpdf, redaction corpus
e2e/                      playwright: merge, redact (pixel-verified), no-network proof
```

## Rules of the codebase

- Nothing may send document bytes anywhere. CSP (`vercel.json`) enforces `connect-src 'self'`; keep it that way.
- No third-party scripts/fonts/analytics. System fonts only.
- Engines (`pdf-lib`, `pdfjs-dist`) load lazily in the client; never import them in server components.

Proprietary — not open source (see DESIGN.md §7).
