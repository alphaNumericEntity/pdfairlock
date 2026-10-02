import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { COMPETITORS, COMPETITORS_UPDATED } from "@/lib/competitors";
import { SITE_URL } from "@/lib/site";
import { TOOLS, TOOLS_UPDATED } from "@/lib/tools";

export const dynamic = "force-static";

const STATIC_PAGES: { path: string; lastModified: string }[] = [
  { path: "", lastModified: "2026-09-15" },
  { path: "/privacy", lastModified: "2026-09-04" },
  { path: "/pricing", lastModified: "2026-09-04" },
  { path: "/why-not-upload-pdfs", lastModified: "2026-08-04" },
  { path: "/pdf-redaction-for-law-firms", lastModified: "2026-09-04" },
  { path: "/compare", lastModified: "2026-09-07" },
  { path: "/blog", lastModified: "2026-09-15" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  return [
    ...STATIC_PAGES.map((p) => ({ url: `${base}${p.path}`, lastModified: p.lastModified })),
    ...COMPETITORS.map((c) => ({ url: `${base}/${c.slug}`, lastModified: COMPETITORS_UPDATED })),
    ...ARTICLES.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: a.date })),
    ...TOOLS.map((t) => ({ url: `${base}/${t.slug}`, lastModified: TOOLS_UPDATED })),
  ];
}
