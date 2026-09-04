import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PDFAirlock — private PDF tools",
    short_name: "PDFAirlock",
    description: "PDF tools that work with your wifi off. Files never leave your device.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: "#047857",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
