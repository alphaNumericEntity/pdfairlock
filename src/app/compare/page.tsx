import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PDFAirlock vs iLovePDF, Smallpdf, Adobe & PDF24 — an honest comparison",
  description:
    "How PDFAirlock compares to iLovePDF, Smallpdf, Adobe's online tools, PDF24, Sejda and Stirling PDF — including what each does better, and how to verify any PDF tool's privacy yourself.",
  alternates: { canonical: "/compare" },
};

const FAQ = [
  {
    q: "Is it safe to use iLovePDF or Smallpdf for confidential documents?",
    a: "Their web tools work by uploading your file to their servers for processing — you can watch the upload happen in your browser's network tab. Both are reputable companies with published deletion policies, but for documents under confidentiality obligations (client files, medical records, HR documents), the upload itself may be the problem regardless of policy. Tools that process files locally in your browser avoid the question entirely.",
  },
  {
    q: "What's the best iLovePDF alternative that doesn't upload files?",
    a: "Any tool that processes documents in your browser rather than on a server. PDFAirlock does all 14 of its tools client-side — merge, split, compress, redact, sign, password-protect — and you can verify it: process a file with the network tab open (zero requests), or turn off your wifi and keep working.",
  },
  {
    q: "Do any PDF tools work completely offline?",
    a: "Desktop apps like PDF24 (Windows) and Adobe Acrobat work offline by nature. Among web tools, PDFAirlock works offline after your first visit — the whole app is cached in your browser, so it keeps working in airplane mode.",
  },
  {
    q: "How can I check whether a PDF tool uploads my files?",
    a: "Open your browser's developer tools, switch to the Network tab, and process a file. If you see a request carrying your file to a server, it uploads. If processing happens with zero requests — or with your wifi off — it's local. This test works on any tool, including this one.",
  },
];

const TABLE = {
  columns: ["", "PDFAirlock", "iLovePDF", "Smallpdf", "Adobe online", "PDF24 online"],
  rows: [
    [
      "Where files are processed",
      "Your browser",
      "Their servers",
      "Their servers",
      "Adobe cloud",
      "Their servers",
    ],
    [
      "Works offline / in airplane mode",
      "Yes, after first visit",
      "No (web)",
      "No",
      "No",
      "No (desktop app: yes)",
    ],
    ["Account required", "Never", "For most features", "For most features", "Yes", "No"],
    [
      "Price model",
      "Free (beta); one-time later",
      "Subscription",
      "Subscription",
      "Subscription",
      "Free (ad/brand supported)",
    ],
    ["Redaction with verification report", "Yes", "No", "No", "No", "No"],
    [
      "Privacy claim you can verify yourself",
      "Network tab / wifi off",
      "Policy-based",
      "Policy-based",
      "Policy-based",
      "Policy-based (web)",
    ],
  ],
};

export default function ComparePage() {
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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight">
        PDFAirlock vs the big PDF sites — an honest comparison
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        The tools below are all competent, and some do things we don&apos;t. The structural
        difference is a single question: <strong>does your file leave your device?</strong> For
        theirs, processing happens on a server. For ours, it can&apos;t — and you don&apos;t have to
        take either claim on faith:{" "}
        <Link href="/privacy" className="text-brand underline">
          here&apos;s how to verify any PDF tool in 30 seconds
        </Link>
        .
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse overflow-hidden rounded-2xl border border-zinc-200 bg-surface text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left">
              {TABLE.columns.map((c, i) => (
                <th
                  key={c || "dimension"}
                  className={`px-4 py-3 ${i === 1 ? "font-semibold text-brand-dark" : "font-medium text-ink-soft"}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE.rows.map((row) => (
              <tr key={row[0]} className="border-t border-zinc-100">
                {row.map((cell, i) => (
                  <td
                    key={`${row[0]}-${TABLE.columns[i]}`}
                    className={`px-4 py-3 ${i === 0 ? "font-medium" : i === 1 ? "text-brand-dark" : "text-ink-soft"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Based on each product&apos;s publicly documented behavior as of September 2026. All
        trademarks belong to their owners. Spot something outdated? support@pdfairlock.com.
      </p>

      <section className="mt-12 space-y-10">
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs iLovePDF</h2>
          <p className="mt-1 text-sm">
            <Link href="/ilovepdf-alternative" className="font-medium text-brand underline">
              Full breakdown: the iLovePDF alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            iLovePDF is the giant of the category: more tools than us (including OCR and conversions
            to Office formats), polished mobile apps, and a mature desktop app. If you need
            Word-to-PDF conversion on your phone, it&apos;s a fine choice. The trade-off is
            architectural: its web tools upload your document to iLovePDF&apos;s servers for
            processing. For a flyer, that&apos;s irrelevant; for a client contract or an HR file,
            the upload itself can breach obligations no deletion policy fixes. PDFAirlock covers the
            everyday operations — merge, split, compress, redact, sign, protect — without your file
            ever leaving the tab, and it&apos;s the only one of the two with verified redaction.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs Smallpdf</h2>
          <p className="mt-1 text-sm">
            <Link href="/smallpdf-alternative" className="font-medium text-brand underline">
              Full breakdown: the Smallpdf alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Smallpdf pairs a clean interface with team features and e-signature workflows aimed at
            businesses. Like iLovePDF, its web tools are upload-based, and the free tier pushes
            toward a subscription. If your team wants managed e-sign workflows with an audit trail,
            Smallpdf earns its subscription. If what you actually do is merge, compress and
            occasionally redact — and you&apos;d rather no third party ever hold the document —
            local processing plus one-time pricing (when our beta ends) is the better shape.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs Adobe&apos;s online tools</h2>
          <p className="mt-1 text-sm">
            <Link href="/adobe-acrobat-alternative" className="font-medium text-brand underline">
              Full breakdown: the Acrobat alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Adobe Acrobat remains the deepest PDF editor there is — true in-place text editing,
            forms authoring, PDF/A, print production. Nothing in this category, us included,
            replaces desktop Acrobat for heavy editing. But Adobe&apos;s free online tools route
            documents through Adobe&apos;s cloud with an account sign-in, and the subscription is
            the priciest here. Most people paying for Acrobat use a fraction of it; if your fraction
            is the everyday operations, a local-only tool covers it without the cloud or the monthly
            bill.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs PDF24</h2>
          <p className="mt-1 text-sm">
            <Link href="/pdf24-alternative" className="font-medium text-brand underline">
              Full breakdown: the PDF24 alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Credit where due: PDF24&apos;s free Windows desktop app processes files locally — on
            that dimension it and PDFAirlock agree completely, and if you&apos;re on Windows and
            happy installing software, it&apos;s a genuinely good free option. The differences:
            PDF24&apos;s <em>online</em> tools are server-based like everyone else&apos;s, the
            desktop app is Windows-only, and there&apos;s no equivalent of a redaction verification
            report. PDFAirlock brings the local-processing model to every OS with a browser — Mac,
            Linux, ChromeOS, locked-down work machines where you can&apos;t install anything.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs Sejda</h2>
          <p className="mt-1 text-sm">
            <Link href="/sejda-alternative" className="font-medium text-brand underline">
              Full breakdown: the Sejda alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Sejda deserves a mention for honesty — it&apos;s one of the few incumbents whose web
            version offers some in-browser processing for certain tools, alongside its server-based
            ones and a desktop app. Its pass-based pricing is also friendlier than pure
            subscriptions. The distinction with PDFAirlock is totality: every tool here is local,
            always, enforced by the site&apos;s security policy rather than varying by feature — so
            there&apos;s never a &ldquo;which mode am I in?&rdquo; question with a confidential
            file.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">PDFAirlock vs Stirling PDF</h2>
          <p className="mt-1 text-sm">
            <Link href="/stirling-pdf-alternative" className="font-medium text-brand underline">
              Full breakdown: the Stirling PDF alternative page →
            </Link>
          </p>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Stirling PDF is the self-hoster&apos;s answer: open source, runs on your own server,
            more tools than us. If you enjoy running containers, it&apos;s excellent. Its
            requirement is the catch — a Docker host, updates, and the operational care that
            entails, which rules out most non-technical users and every locked-down machine.
            PDFAirlock is the same core promise — your files stay yours — with nothing to install,
            host, or maintain: the browser is the server.
          </p>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <h2 className="text-xl font-semibold text-brand-dark">The test that settles it</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Don&apos;t take this page&apos;s word for any of it. Open a tool — theirs or ours — with
          your browser&apos;s Network tab open, and process a file. An upload is visible in one
          second. Then try the same with your wifi off.{" "}
          <Link href="/merge-pdf" className="text-brand-dark underline">
            Start with our merger
          </Link>{" "}
          — it works in airplane mode.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 space-y-5">
          {FAQ.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium">{f.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
