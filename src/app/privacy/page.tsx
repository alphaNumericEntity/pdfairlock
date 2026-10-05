import type { Metadata } from "next";
import Link from "next/link";
import { SOURCE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Why your files never leave your device — and how to verify it",
  description:
    "PDFAirlock processes every file inside your browser. No uploads, no analytics, no cookies. Here's exactly how that works and how to check it yourself in 30 seconds.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Your files never leave your device. Here&apos;s how to check.
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        We don&apos;t ask you to trust a privacy policy. The architecture makes uploading
        impossible, and you can verify every claim below yourself.
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">The 30-second verification</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>Open any tool page, e.g. the PDF merger.</li>
            <li>
              Turn off your wifi (or enable airplane mode). If it&apos;s already loaded, the page
              keeps working — merge, compress, redact, everything.
            </li>
            <li>
              Or: open your browser&apos;s developer tools → Network tab, then process a file.
              You&apos;ll see zero requests while your document is processed. Nothing to a server,
              nothing to a CDN, nothing to an analytics pixel — because none of those exist here.
            </li>
            <li>
              Or read the code:{" "}
              <a href={SOURCE_URL} rel="noopener" className="text-brand underline">
                the whole site is on GitHub
              </a>{" "}
              under AGPL-3.0, including the security policy header described below and the tests
              that check the redaction output.
            </li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            This site is static files: HTML, JavaScript and WebAssembly. When you pick a file, your
            browser reads it into memory and the processing libraries (the same kind of engines
            desktop apps use, compiled for the browser) do the work on your machine. The result is
            handed back to you as a download from your own memory. Our hosting serves the app and
            can&apos;t do anything else — there is no API, no database, and no endpoint that could
            accept a file even if we wanted one.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Enforced, not promised</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
            <li>
              A Content-Security-Policy header (
              <code className="rounded bg-zinc-100 px-1">connect-src &apos;self&apos;</code>)
              instructs your browser to block this site from contacting any other server. Even a bug
              or a compromised dependency couldn&apos;t exfiltrate your file past it.
            </li>
            <li>
              No analytics, no cookies, no third-party scripts, no external fonts. View source.
            </li>
            <li>
              The service worker caches the whole app on first visit, which is why it works offline
              afterwards.
            </li>
            <li>
              The only thing ever stored is your license key (if you buy one) in your own
              browser&apos;s localStorage.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">What we can&apos;t protect you from</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Honesty matters more than marketing: we can&apos;t protect against malware already on
            your device, a compromised browser, or you sharing the output with the wrong person. And
            for redaction specifically — always review the verified output before distributing it.
            Software has bugs; our verification report exists so you never have to take even our
            word for it.
          </p>
        </div>
      </section>

      <p className="mt-12">
        <Link href="/#tools" className="font-medium text-brand underline">
          ← Back to the tools
        </Link>
      </p>
    </div>
  );
}
