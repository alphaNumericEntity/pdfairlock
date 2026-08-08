import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — everything is free during beta",
  description:
    "All AirgapPDF tools are completely free while we're in beta. Paid licenses will be one-time purchases — never a subscription — and will be announced here.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="inline-flex items-center rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand-dark">
        Beta
      </p>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Everything is free right now
      </h1>
      <p className="mt-5 text-lg text-ink-soft">
        All 14 tools. No limits, no account, no catch — and as always, your files never leave your
        device.
      </p>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-surface p-6 text-left">
        <p className="font-semibold">What happens after beta?</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          At some point we&apos;ll introduce paid licenses for advanced features. Two promises we
          can already make: it will be a <strong>one-time purchase, never a subscription</strong>
          {" — "}we don&apos;t run servers to process your files, so we don&apos;t need to charge
          you rent — and people who used AirgapPDF during the beta will get a launch discount.
          Pricing will be announced on this page.
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/#tools"
          className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Use the tools — free
        </Link>
      </p>
    </div>
  );
}
