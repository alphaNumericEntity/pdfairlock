import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Blog — engineering notes from building PDFAirlock",
  description:
    "War stories and design deep-dives from building a fully client-side PDF toolkit: CSP vs WebAssembly, verifiable redaction, and making a website work in airplane mode.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Engineering notes</h1>
      <p className="mt-4 text-lg text-ink-soft">
        What we learned building a PDF toolkit that runs entirely in the browser — the bugs, the
        design calls, and the verification machinery.
      </p>
      <div className="mt-10 space-y-8">
        {ARTICLES.map((a) => (
          <article key={a.slug} className="rounded-2xl border border-zinc-200 bg-surface p-6">
            <p className="text-xs text-ink-soft">{a.date}</p>
            <h2 className="mt-1 text-xl font-semibold">
              <Link href={`/blog/${a.slug}`} className="hover:text-brand-dark">
                {a.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.blurb}</p>
            <p className="mt-3 text-sm">
              <Link href={`/blog/${a.slug}`} className="font-medium text-brand underline">
                Read →
              </Link>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
