import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  return [
    { url: base, priority: 1 },
    { url: `${base}/privacy`, priority: 0.6 },
    { url: `${base}/pricing`, priority: 0.6 },
    { url: `${base}/why-not-upload-pdfs`, priority: 0.7 },
    { url: `${base}/pdf-redaction-for-law-firms`, priority: 0.7 },
    ...TOOLS.map((t) => ({ url: `${base}/${t.slug}`, priority: 0.9 })),
  ];
}
