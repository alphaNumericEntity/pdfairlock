# Security

## Reporting

Report anything security-relevant privately, not as a public issue: use GitHub's
[private vulnerability reporting](https://github.com/alphanumericentity/pdfairlock/security/advisories/new)
on this repository. Expect a reply within a few days. This is a solo project, so there is no
bounty, and credit in the fix notes is yours unless you'd rather not be named.

## What counts as a vulnerability here

The product makes one security claim: document bytes never leave the browser. So anything
that breaks that is the highest severity available, however small it looks:

- any path that sends file content, file names or extracted text to any origin
- a way to weaken or bypass the Content-Security-Policy, particularly `connect-src 'self'`
- a service-worker cache poisoning route that could serve altered app code
- **redaction that does not redact**: output where text survives under a box, or where a
  search term the report called clean is still extractable

That last one has a dedicated test suite because it has already happened once here. If you
find a document shape where the search-driven boxes land in the wrong place, that is a
security bug, not a cosmetic one.

## Out of scope

- Anything requiring an attacker to already control the user's machine or browser extensions
- Denial of service through enormous files. Processing is bounded by the device's memory and
  the UI says so
- Missing hardening headers that do not affect the no-upload guarantee
- Reports from automated scanners with no demonstrated impact
