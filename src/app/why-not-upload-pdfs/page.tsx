import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Is it safe to upload PDFs to free online tools?",
  description:
    "What actually happens when you upload a PDF to a free converter, who shouldn't do it, and how browser-based processing removes the risk entirely.",
  alternates: { canonical: "/why-not-upload-pdfs" },
};

const FAQ = [
  {
    q: "What happens to my file when I upload it to a free PDF site?",
    a: "It is transmitted to the company's servers, processed there, stored at least temporarily, and covered by whatever their privacy policy and retention rules say today. Most reputable sites delete files after a period — but you are trusting a policy you can't observe, applied by a company you can't audit, in a jurisdiction you may not know.",
  },
  {
    q: "Is that actually a problem for normal people?",
    a: "For holiday photos, no. For anything covered by confidentiality — client contracts, medical records, immigration files, payroll, unreleased financials — the upload itself can be the violation, regardless of what happens to the file afterwards. Many professional obligations (attorney-client privilege, HIPAA, NDAs) don't have a 'but the website said it deletes files' exception.",
  },
  {
    q: "How can a website process PDFs without uploading them?",
    a: "Modern browsers can run real software — the same kind of engines desktop apps use — via JavaScript and WebAssembly. The page you load IS the program; your file goes from your disk into your browser's memory, gets processed there, and comes back out as a download. No server is involved in the processing at all.",
  },
  {
    q: "How do I verify a tool really works this way?",
    a: "Two checks anyone can do: open your browser's developer tools, watch the Network tab while processing a file — there should be zero requests. Or load the page, turn on airplane mode, and use the tool: if it still works, there is provably no server involved.",
  },
];

export default function WhyNotUploadPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        Is it safe to upload PDFs to free online tools?
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Short answer: for anything confidential, you shouldn&apos;t have to ask — because uploading
        is unnecessary. Here&apos;s what actually happens, and the alternative.
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="text-xl font-semibold">
            What &ldquo;free online PDF tool&rdquo; usually means
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Nearly every well-known PDF site works the same way: your file is uploaded to their
            servers, processed there, and handed back as a download link. The site&apos;s privacy
            promise — however sincere — is a policy, not a property of the system. Policies change,
            companies get acquired, servers get breached, and retention rules are invisible to you.
            If the document is a lease, that&apos;s probably fine. If it&apos;s a client contract, a
            medical record, or an HR file, the upload itself may already breach your obligations.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            The alternative: tools with nowhere to upload to
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Browsers can now run real document engines locally via WebAssembly. Every tool on this
            site —{" "}
            <Link href="/merge-pdf" className="text-brand underline">
              merge
            </Link>
            ,{" "}
            <Link href="/compress-pdf" className="text-brand underline">
              compress
            </Link>
            ,{" "}
            <Link href="/redact-pdf" className="text-brand underline">
              redact
            </Link>
            ,{" "}
            <Link href="/sign-pdf" className="text-brand underline">
              sign
            </Link>
            ,{" "}
            <Link href="/unlock-pdf" className="text-brand underline">
              unlock
            </Link>{" "}
            — runs entirely in your browser tab. Our server serves the app and can&apos;t do
            anything else: there is no endpoint that accepts files, and the site&apos;s security
            policy blocks it from contacting any other server. You don&apos;t have to trust that
            claim —{" "}
            <Link href="/privacy" className="text-brand underline">
              here&apos;s how to verify it in 30 seconds
            </Link>
            .
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="mt-12">
        <Link href="/#tools" className="font-medium text-brand underline">
          Try the tools — no account, no upload →
        </Link>
      </p>
    </div>
  );
}
