import Link from "next/link";
import { COMPETITORS, type Competitor } from "@/lib/competitors";

export function CompetitorPage({ competitor }: { competitor: Competitor }) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: competitor.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const siblings = COMPETITORS.filter((c) => c.slug !== competitor.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD from our own registry
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight">{competitor.h1}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{competitor.intro}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Why people look for a {competitor.name} alternative
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
          {competitor.switchReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">What {competitor.name} does better</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">{competitor.strengths}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Switching: your {competitor.name} task, done here</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Every tool below runs in your browser — no upload, no account, and it works offline after
          your first visit.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse overflow-hidden rounded-2xl border border-zinc-200 bg-surface text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left">
                <th className="px-4 py-3 font-medium text-ink-soft">On {competitor.name}</th>
                <th className="px-4 py-3 font-semibold text-brand-dark">On PDFAirlock</th>
              </tr>
            </thead>
            <tbody>
              {competitor.migration.map((m) => (
                <tr key={m.theirs} className="border-t border-zinc-100">
                  <td className="px-4 py-3">{m.theirs}</td>
                  <td className="px-4 py-3">
                    <Link href={m.route} className="font-medium text-brand underline">
                      {m.ours}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">When to stay with {competitor.name}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
          {competitor.stayIf.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <h2 className="text-xl font-semibold text-brand-dark">Verify it in 30 seconds</h2>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Don&apos;t trust this page — test it. Open any tool with your browser&apos;s Network tab
          visible and process a file: zero requests. Or load the page, turn on airplane mode, and
          keep working.{" "}
          <Link href="/privacy" className="text-brand-dark underline">
            How the enforcement works →
          </Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="mt-4 space-y-5">
          {competitor.faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-medium">{f.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 text-sm text-ink-soft">
        <p>
          More comparisons:{" "}
          <Link href="/compare" className="text-brand underline">
            the full side-by-side
          </Link>
          {siblings.map((s) => (
            <span key={s.slug}>
              {" · "}
              <Link href={`/${s.slug}`} className="text-brand underline">
                vs {s.name}
              </Link>
            </span>
          ))}
        </p>
        <p className="mt-3 text-xs text-zinc-400">
          Based on publicly documented behavior as of September 2026. All trademarks belong to their
          owners. Corrections: support@pdfairlock.com.
        </p>
      </section>
    </div>
  );
}
