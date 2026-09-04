import Link from "next/link";
import { Logo } from "./icons";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Logo className="h-7 w-7" />
          <span>
            PDF<span className="text-brand">Airlock</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-soft">
          <Link href="/#tools" className="hidden hover:text-ink sm:inline">
            Tools
          </Link>
          <Link href="/privacy" className="hidden hover:text-ink sm:inline">
            Why it&apos;s private
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-zinc-200 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-soft">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-md space-y-2">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Logo className="h-5 w-5" /> PDFAirlock
            </div>
            <p>
              Every tool on this site runs entirely in your browser. Your files never leave your
              device — turn off your wifi and see for yourself.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-2">
            <Link href="/#tools" className="hover:text-ink">
              All tools
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy &amp; how to verify
            </Link>
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/redact-pdf" className="hover:text-ink">
              Redact a PDF
            </Link>
            <Link href="/why-not-upload-pdfs" className="hover:text-ink">
              Why never upload PDFs
            </Link>
            <Link href="/pdf-redaction-for-law-firms" className="hover:text-ink">
              For law firms
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-xs text-zinc-400">
          © {new Date().getFullYear()} PDFAirlock. Software provided as-is; verify output before
          distributing sensitive documents.
        </p>
      </div>
    </footer>
  );
}
