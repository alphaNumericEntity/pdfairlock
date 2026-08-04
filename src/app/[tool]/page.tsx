import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WifiOffIcon } from "@/components/icons";
import { PrivacyBadge } from "@/components/tool-ui";
import { ToolBody } from "@/components/tools";
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: meta.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{meta.name}</h1>
        <p className="text-lg text-ink-soft">{meta.tagline}</p>
        <PrivacyBadge />
      </div>

      <div className="mt-8">
        <ToolBody slug={meta.slug} />
      </div>

      <section className="mt-14 rounded-2xl border border-zinc-200 bg-surface p-6">
        <p className="flex items-center gap-2 font-semibold">
          <WifiOffIcon className="h-5 w-5 text-brand" /> Don&apos;t trust us — test us
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          Load this page, then turn off your wifi. The tool keeps working, because your file is
          processed by your own browser — there is no server involved and nowhere to upload to.{" "}
          <Link href="/privacy" className="text-brand underline">
            How to verify this yourself →
          </Link>
        </p>
      </section>

      <section className="mt-10">
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

      <section className="mt-10">
        <h2 className="text-xl font-semibold">More tools</h2>
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
