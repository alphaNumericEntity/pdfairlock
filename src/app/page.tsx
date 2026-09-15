import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon, WifiOffIcon } from "@/components/icons";
import { ARTICLES } from "@/lib/articles";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const COMPARISON = [
  { q: "Files uploaded to a server?", us: "Never", them: "Yes, every file" },
  { q: "Works offline / on a plane?", us: "Yes", them: "No" },
  { q: "Account required?", us: "No", them: "For most features" },
  { q: "Pricing", us: "Free — never a subscription", them: "$7–20 every month" },
  { q: "Verifiable privacy?", us: "Check the network tab", them: "Trust their policy" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 text-center sm:py-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand-dark">
          <WifiOffIcon className="h-4 w-4" /> Try it with your wifi off — seriously
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          PDF tools that <span className="text-brand">never upload</span> your files
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
          Merge, split, compress, redact and sign PDFs entirely in your browser. No uploads, no
          account, no tracking — your documents stay on your device, provably.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/merge-pdf"
            className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
          >
            Merge PDFs now
          </Link>
          <Link
            href="/redact-pdf"
            className="rounded-xl border border-zinc-300 bg-surface px-6 py-3 font-medium hover:border-brand"
          >
            Redact a document
          </Link>
        </div>
      </section>

      <section id="tools" className="py-8">
        <h2 className="text-2xl font-bold">All tools</h2>
        <p className="mt-1 text-ink-soft">Every one runs 100% locally. Free, no sign-up.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="block h-full rounded-2xl border border-zinc-200 bg-surface p-5 transition-colors hover:border-brand"
              >
                <p className="flex items-center justify-between font-semibold">
                  {t.name}
                  {t.flagship && (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark">
                      Flagship
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-sm text-ink-soft">{t.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="guides" className="py-8">
        <h2 className="text-2xl font-bold">Guides</h2>
        <p className="mt-1 text-ink-soft">
          Step by step, with the checks that prove nothing was uploaded.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {ARTICLES.filter((a) => a.kind === "guide").map((a) => (
            <li key={a.slug}>
              <Link
                href={`/blog/${a.slug}`}
                className="block h-full rounded-2xl border border-zinc-200 bg-surface p-5 transition-colors hover:border-brand"
              >
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1.5 text-sm text-ink-soft">{a.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="py-16">
        <div className="rounded-3xl bg-hero px-6 py-12 text-white sm:px-12">
          <div className="flex items-start gap-4">
            <ShieldIcon className="mt-1 h-8 w-8 shrink-0 text-emerald-400" />
            <div>
              <h2 className="text-2xl font-bold">
                Why &ldquo;private&rdquo; actually means something here
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
                Every popular PDF site works by uploading your document to their server. Their
                privacy is a policy — a promise that could change or be breached. Ours is an
                architecture: this site is static files plus your browser. There is no endpoint that
                can receive a document, and our security policy blocks the site from talking to any
                other server. If you handle contracts, medical records, HR files or client data,
                that difference is the whole point.
              </p>
              <p className="mt-4">
                <Link href="/privacy" className="font-medium text-emerald-400 underline">
                  See how to verify it in 30 seconds →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <h2 className="text-2xl font-bold">PDFAirlock vs. the upload-everything sites</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse overflow-hidden rounded-2xl border border-zinc-200 bg-surface text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium" />
                <th className="px-4 py-3 font-semibold text-brand-dark">PDFAirlock</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Typical PDF site</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.q} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium">{row.q}</td>
                  <td className="px-4 py-3 text-brand-dark">{row.us}</td>
                  <td className="px-4 py-3 text-ink-soft">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/compare" className="font-medium text-brand underline">
            See the detailed comparison vs iLovePDF, Smallpdf, Adobe, PDF24 and more →
          </Link>
        </p>
      </section>
    </div>
  );
}
