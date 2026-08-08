import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SwRegister } from "@/components/sw-register";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Merge, split, compress, redact and sign PDFs entirely in your browser. No uploads, no account, no tracking. Your files never leave your device.",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <SwRegister />
      </body>
    </html>
  );
}
