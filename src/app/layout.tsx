import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SwRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://airgappdf.com"),
  title: {
    default: "AirgapPDF — PDF tools that work with your wifi off",
    template: "%s · AirgapPDF",
  },
  description:
    "Merge, split, compress, redact and sign PDFs entirely in your browser. No uploads, no account, no tracking. Your files never leave your device.",
  icons: { icon: "/icon.svg" },
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
