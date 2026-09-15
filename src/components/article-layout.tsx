import Link from "next/link";
import type { Article } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import type { FaqItem } from "@/lib/tools";

export function ArticleLayout({
  article,
  faq,
  children,
}: {
  article: Article;
  faq?: FaqItem[];
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.date,
    url: `${SITE_URL}/blog/${article.slug}`,
    author: { "@type": "Person", name: "alphaNumericEntity" },
    publisher: { "@type": "Organization", name: "PDFAirlock", url: SITE_URL },
  };
  const faqJsonLd = faq && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <p className="text-sm text-ink-soft">
        <Link href="/blog" className="text-brand underline">
          ← Blog
        </Link>{" "}
        · {article.date}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{article.title}</h1>
      <div className="mt-6 space-y-5 leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink">
        {children}
      </div>
      {faq && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 space-y-5">
            {faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="mt-12 rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <p className="leading-relaxed text-ink-soft">
          This post is from building{" "}
          <Link href="/" className="font-medium text-brand-dark underline">
            PDFAirlock
          </Link>{" "}
          — PDF tools that run entirely in your browser and keep working with your wifi off. Free,
          no account, and every privacy claim is verifiable.
        </p>
      </div>
    </article>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
      <code>{children}</code>
    </pre>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
