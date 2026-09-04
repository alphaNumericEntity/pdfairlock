import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "PDF redaction for law firms — verifiable, and nothing leaves the machine",
  description:
    "True redaction for legal documents: text is destroyed, not covered, with a verification report you can file away — processed entirely on your own machine.",
  alternates: { canonical: "/pdf-redaction-for-law-firms" },
};

export default function LawFirmsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        PDF redaction for law firms that actually destroys the text
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Two failure modes have burned firms repeatedly: black boxes drawn over text that&apos;s
        still selectable underneath, and confidential documents uploaded to third-party servers to
        do the redacting. This tool eliminates both.
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">Why black rectangles keep failing</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            In a PDF, drawing a black shape over text doesn&apos;t remove the text — it sits in the
            file underneath, one copy-paste away. Court filings redacted this way have been
            unredacted by journalists and opposing counsel with nothing more than select-all. Proper
            redaction must rewrite the document so the content ceases to exist. PDFAirlock rebuilds
            redacted pages from pixels: after processing, there is no text object left to extract on
            those pages.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">The verification report</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            After every redaction, the tool re-opens the output and audits it: zero extractable text
            on redacted pages, your search terms absent from the file&apos;s bytes, document
            metadata (author, title, revision info) stripped. If a searched name still appears on a
            page you didn&apos;t redact, the report tells you which page — before the document
            leaves your office. It&apos;s the answer to &ldquo;are you sure it&apos;s really
            gone?&rdquo; that you can screenshot into the file.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Privilege-compatible by architecture</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Nothing is uploaded, ever — the processing happens in the browser on the machine the
            document already sits on. There is no vendor server holding privileged material, no
            processing agreement to review, no retention policy to audit. Load the page, disconnect
            from the internet, and redact: it works, which is the proof.{" "}
            <Link href="/privacy" className="text-brand underline">
              How to verify this yourself →
            </Link>
          </p>
        </div>
        <div className="rounded-2xl border border-brand/30 bg-brand-soft p-6">
          <p className="flex items-center gap-2 font-semibold text-brand-dark">
            <ShieldIcon className="h-5 w-5" /> For firms
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Site licenses with a procurement-friendly invoice are coming with our paid launch —
            one-time pricing, no subscription, offline license files for air-gapped machines. Until
            then, everything is free to use in beta.{" "}
            <Link href="/pricing" className="text-brand-dark underline">
              See pricing →
            </Link>
          </p>
        </div>
      </section>

      <p className="mt-12">
        <Link href="/redact-pdf" className="font-medium text-brand underline">
          Redact a document now — free, no account →
        </Link>
      </p>
    </div>
  );
}
