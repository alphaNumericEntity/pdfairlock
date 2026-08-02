import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://airgappdf.com";
  return [
    { url: base, priority: 1 },
    { url: `${base}/privacy`, priority: 0.6 },
    { url: `${base}/pricing`, priority: 0.6 },
    ...TOOLS.map((t) => ({ url: `${base}/${t.slug}`, priority: 0.9 })),
  ];
}
