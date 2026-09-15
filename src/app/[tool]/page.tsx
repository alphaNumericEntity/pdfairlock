import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WifiOffIcon } from "@/components/icons";
import { PrivacyBadge } from "@/components/tool-ui";
import { ToolBody } from "@/components/tools";
import { mustGetArticle } from "@/lib/articles";
import { getTool, TOOLS } from "@/lib/tools";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const meta = getTool(tool);
  if (!meta) return {};
  return {
    title: meta.metaTitle,
    description: meta.metaDescription,
    alternates: { canonical: `/${meta.slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = getTool(tool);
  if (!meta) notFound();
  const guide = mustGetArticle(meta.guide);
  const howToTitle = `How to ${meta.h1.charAt(0).toLowerCase()}${meta.h1.slice(1)}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howToTitle,
    description: meta.metaDescription,
    totalTime: "PT1M",
    tool: [{ "@type": "HowToTool", name: "A current web browser" }],
    step: meta.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{meta.h1}</h1>
        <p className="text-lg text-ink-soft">{meta.tagline}</p>
        <PrivacyBadge />
      </div>

      <div className="mt-8">
        <ToolBody slug={meta.slug} />
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">{howToTitle}</h2>
        <ol className="mt-4 space-y-3">
          {meta.steps.map((step, i) => (
            <li key={step} className="flex gap-3 leading-relaxed text-ink-soft">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-soft">
          Every step runs in this tab. The site has no upload endpoint, and the page&apos;s security
          policy forbids the browser from contacting any other server — see{" "}
          <Link href="/privacy" className="text-brand underline">
            how that is enforced
          </Link>
          .
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">When you&apos;d use it</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {meta.useCases.map((u) => (
            <div key={u.title} className="rounded-2xl border border-zinc-200 bg-surface p-4">
              <h3 className="font-medium">{u.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Good to know</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-ink-soft">
          {meta.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-zinc-200 bg-surface p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <WifiOffIcon className="h-5 w-5 text-brand" /> Don&apos;t trust us — test us
        </h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          &ldquo;Your files never leave your device&rdquo; is a claim every PDF site makes. Here it
          is checkable in under a minute, three different ways:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-ink-soft">
          <li>
            <strong className="text-ink">Watch the network.</strong> Open your browser&apos;s
            developer tools, switch to the Network tab, then run the tool. The only requests you
            will see are the site&apos;s own files — none of them carries your document — and once
            the app is cached there are no requests at all.
          </li>
          <li>
            <strong className="text-ink">Pull the plug.</strong> Load this page, turn off your wifi
            or switch on airplane mode, then use the tool. It keeps working, because there is no
            server involved and nowhere to upload to.
          </li>
          <li>
            <strong className="text-ink">Read the headers.</strong> The response headers for this
            page include a Content-Security-Policy with{" "}
            <code className="rounded bg-zinc-100 px-1">connect-src &apos;self&apos;</code>: the
            browser itself refuses to send anything to another host, whatever the code asks.
          </li>
        </ol>
        <p className="mt-3 text-sm text-ink-soft">
          <Link href="/privacy" className="text-brand underline">
            The full privacy model, including what we can&apos;t protect you from →
          </Link>
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <p className="text-sm font-medium text-brand-dark">Guide</p>
        <h2 className="mt-1 text-lg font-semibold">
          <Link href={`/blog/${guide.slug}`} className="hover:text-brand-dark">
            {guide.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{guide.blurb}</p>
        <p className="mt-3 text-sm">
          <Link href={`/blog/${guide.slug}`} className="font-medium text-brand underline">
            Read the guide →
          </Link>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 space-y-5">
          {meta.faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium">{f.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">More tools that never upload</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {TOOLS.filter((t) => t.slug !== meta.slug).map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="inline-block rounded-full border border-zinc-300 bg-surface px-3 py-1.5 text-sm hover:border-brand hover:text-brand-dark"
              >
                {t.shortName}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
