import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES, type Article } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Blog — guides and engineering notes from building PDFAirlock",
  description:
    "Practical guides to working with PDFs without uploading them, and war stories from building a fully client-side PDF toolkit: CSP vs WebAssembly, verifiable redaction, and a site that works in airplane mode.",
  alternates: { canonical: "/blog" },
};

function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-surface p-6">
      <p className="text-xs text-ink-soft">{a.date}</p>
      <h3 className="mt-1 text-xl font-semibold">
        <Link href={`/blog/${a.slug}`} className="hover:text-brand-dark">
          {a.title}
        </Link>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.blurb}</p>
      <p className="mt-3 text-sm">
        <Link href={`/blog/${a.slug}`} className="font-medium text-brand underline">
          Read →
        </Link>
      </p>
    </article>
  );
}

export default function BlogIndex() {
  const guides = ARTICLES.filter((a) => a.kind === "guide");
  const engineering = ARTICLES.filter((a) => a.kind === "engineering");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Guides and engineering notes</h1>
      <p className="mt-4 text-lg text-ink-soft">
        How to get PDF jobs done without uploading anything, and what we learned building a PDF
        toolkit that runs entirely in the browser.
      </p>
      <h2 className="mt-10 text-2xl font-bold">Guides</h2>
      <div className="mt-4 space-y-6">
        {guides.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-bold">Engineering notes</h2>
      <div className="mt-4 space-y-6">
        {engineering.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>
    </div>
  );
}
