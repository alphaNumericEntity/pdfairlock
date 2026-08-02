# AirgapPDF

PDF tools that work with your wifi off. Merge, split, compress, redact, sign, convert — 100% in your browser. Files never leave your device.

**Read [DESIGN.md](./DESIGN.md) first** — product rationale, architecture, monetization, GTM, roadmap.

## Quickstart

```sh
pnpm install        # also copies pdf.js worker into public/
pnpm dev            # http://localhost:3000
pnpm build          # static export → out/
pnpm test           # vitest unit tests
pnpm check          # biome lint+format check
pnpm check-types    # tsc --noEmit
```

## Layout

```
src/app/                  routes: landing, /[tool] (12 SEO pages), /pricing, /privacy
src/components/           shell UI + per-tool client components (components/tools/*)
src/lib/pdf/              pdf-lib ops, pdf.js helpers, compress, redact + verifier
src/lib/worker/           dedicated worker (ops + zip) and RPC client
src/lib/license/          ed25519 license key verification
scripts/                  keygen (license keys), copy-pdf-worker (postinstall)
tests/                    vitest: ops, ranges, license
```

## Rules of the codebase

- Nothing may send document bytes anywhere. CSP (`vercel.json`) enforces `connect-src 'self'`; keep it that way.
- No third-party scripts/fonts/analytics. System fonts only.
- Engines (`pdf-lib`, `pdfjs-dist`) load lazily in the client; never import them in server components.

Proprietary — not open source (see DESIGN.md §7).
