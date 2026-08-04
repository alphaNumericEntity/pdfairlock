import type { Metadata } from "next";
import Link from "next/link";
import { LicenseEntry } from "@/components/license-entry";

export const metadata: Metadata = {
  title: "Pricing — free tools, one-time Pro. No subscription.",
  description:
    "AirgapPDF's tools are free. Pro (redaction verification, batch) is a one-time purchase — no subscription, no account. Currently in free beta.",
  alternates: { canonical: "/pricing" },
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    features: ["All 14 tools", "No account, no limits on files", "Works offline"],
  },
  {
    name: "Pro",
    price: "$29",
    note: "one-time, lifetime",
    features: [
      "Redaction with verification report",
      "Batch processing",
      "Priority email support",
      "Lock in the price — it's not a subscription",
    ],
    highlight: true,
  },
  {
    name: "Team / Site",
    price: "$79+",
    note: "one-time, invoice included",
    features: [
      "5 seats ($79) or unlimited site license ($299)",
      "Procurement-friendly invoice",
      "Offline license file for air-gapped machines",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold tracking-tight">
        Free tools. One-time Pro. Never a subscription.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-ink-soft">
        We don&apos;t run servers to process your files, so we don&apos;t need to charge you rent.
      </p>

      <p className="mx-auto mt-6 max-w-xl rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-center text-sm text-brand-dark">
        <strong>Beta:</strong> everything, including Pro features, is free right now. Purchasing
        opens soon — early users will get a launch discount.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border bg-surface p-6 ${
              tier.highlight ? "border-brand shadow-md" : "border-zinc-200"
            }`}
          >
            <p className="font-semibold">{tier.name}</p>
            <p className="mt-2 text-3xl font-bold">
              {tier.price} <span className="text-sm font-normal text-ink-soft">{tier.note}</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-brand">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-xl">
        <h2 className="text-xl font-semibold">Already have a license key?</h2>
        <LicenseEntry />
      </div>

      <p className="mt-14 text-center text-sm text-ink-soft">
        Questions?{" "}
        <Link href="/privacy" className="text-brand underline">
          Read how the privacy works
        </Link>{" "}
        — it&apos;s also why one-time pricing is possible.
      </p>
    </div>
  );
}
