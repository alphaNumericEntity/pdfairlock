import Link from "next/link";
import type { Article } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

export function ArticleLayout({
  article,
  children,
}: {
  article: Article;
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
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-sm text-ink-soft">
        <Link href="/blog" className="text-brand underline">
          ← Blog
        </Link>{" "}
        · {article.date}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{article.title}</h1>
      <div className="mt-6 space-y-5 leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
        {children}
      </div>
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
