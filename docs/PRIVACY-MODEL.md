# Privacy model — what we claim, how it's enforced, what it doesn't cover

The product's entire brand is one claim: **your files never leave your device.** This doc is
the engineering version of that sentence — the exact claim, the layers that enforce it, how
anyone can falsify it, and the honest boundary of what it protects.

## The claim, precisely

Document bytes (and passwords typed into the password tools) exist only in the user's
browser memory. No request containing them is ever made — not to us, not to a CDN, not to
an analytics service — because no such request *can* be made.

The claim is about **user data**, not total network silence: the browser fetches the app
itself (HTML/JS/WASM) from our host, and after the first visit the service worker makes
even that unnecessary.

## Enforcement layers (defense in depth, cheapest first)

1. **No receiving code exists.** The deployment is a static export — there is no API route,
   no function, no form handler. This isn't policy; there is nothing to send a file *to*.
2. **CSP makes egress impossible.** Every response carries
   `Content-Security-Policy: … connect-src 'self'; form-action 'self'; object-src 'none'`.
   The browser itself blocks any fetch/XHR/WebSocket/form-post to another origin — including
   from a bug, a compromised dependency, or a malicious contribution. `script-src 'self'`
   means no third-party script can even load. (`'wasm-unsafe-eval'` is present so qpdf's
   WASM can compile; `'unsafe-inline'` covers Next's hydration bootstrap — neither permits
   external communication.)
3. **Everything self-hosted.** pdf.js worker, its font/cmap/wasm assets, both custom
   workers, qpdf's WASM — copied into `public/` at build time. Zero third-party requests
   also means zero third-party *observers*.
4. **No telemetry, no cookies, no accounts.** There is nothing to correlate a visitor with.
   The only stored value is an optional license key in the user's own localStorage.
5. **Offline capability as proof.** The service worker precaches the full app on first
   visit; airplane mode is a live demonstration that no server participates in processing.

## How to falsify it (we teach this on /privacy)

- Open devtools → Network, process a file: zero requests during processing.
- Load a tool page, enable airplane mode, reload, use the tool: it works.
- Read the CSP header (`curl -sI https://pdfairlock.com | grep -i content-security`).
- View source; the client is unminified enough to audit the absence of any upload path.

A privacy policy asks for trust. A CSP plus a wifi toggle doesn't.

## Threat model boundaries — what this does NOT protect against

- **A compromised device or browser.** Malware with local access reads anything.
- **Us shipping different code tomorrow.** The architecture prevents data exfiltration
  *given the shipped CSP and static hosting*; a malicious future deploy could weaken both.
  Mitigations: the claims are continuously verifiable (above), the e2e suite asserts the
  zero-external-requests property on every deploy, and any change to `vercel.json`'s CSP is
  a reviewable diff in git history.
- **The user's own actions.** Sharing the output with the wrong person, or distributing a
  redacted file without reviewing it (the UI says to review; the verification report helps,
  see REDACTION.md).
- **Browser zero-days / supply-chain attacks on our dependencies at build time.** Reduced by
  a small, pinned dependency set and the CSP (exfiltration is blocked even if code is
  compromised), but not eliminated — no honest web product can claim otherwise.
- **Traffic metadata.** The host (Vercel) and any network observer can see that an IP
  fetched the app — as with visiting any website. They cannot see documents, which never
  transit.

## Design rules this imposes going forward

- Any feature requiring document bytes to touch a server is rejected by principle, not
  debated per-case. (Payments, when they come, touch license keys — never documents.)
- Any new external origin (fonts, scripts, telemetry) is a CSP change and therefore a
  deliberate, visible decision — the default answer is no.
- "Does it still work in airplane mode?" is an acceptance criterion for every new tool.
