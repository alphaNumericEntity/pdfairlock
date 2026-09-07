export type Article = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  date: string;
  blurb: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "csp-blocks-webassembly",
    title: "Your CSP can silently kill WebAssembly: a production postmortem",
    metaTitle: "Your CSP can silently kill WebAssembly — a postmortem",
    metaDescription:
      "Every test passed locally; in production, WebAssembly wouldn't compile. The culprit was our own Content-Security-Policy — and the fix is one keyword: wasm-unsafe-eval.",
    date: "2026-09-08",
    blurb:
      "Every test was green locally. In production, half the app was dead — blocked by our own security header. What 'wasm-unsafe-eval' does, and why only a live test run caught it.",
  },
  {
    slug: "pdf-redaction-verification",
    title: "PDF redaction that proves itself",
    metaTitle: "PDF redaction that proves itself — destruction, not concealment",
    metaDescription:
      "Black-rectangle redaction keeps leaking secrets into court records. How PDFAirlock destroys text instead of covering it, then re-opens its own output to prove the redaction worked.",
    date: "2026-09-08",
    blurb:
      "Drawing a black box over text doesn't remove it — that's how real court filings leak. On building redaction as destruction, and a verifier that treats its own output as untrusted.",
  },
  {
    slug: "offline-website-service-worker",
    title: "Making a website work in airplane mode",
    metaTitle: "Making a website work in airplane mode — SW precache lessons",
    metaDescription:
      "The service-worker mistakes between 'we cache things' and a site that genuinely works offline from the first visit — including the deployment quirk that silently broke it.",
    date: "2026-09-08",
    blurb:
      "'Works offline' is easy to claim and easy to get subtly wrong. The gap between runtime caching and a real first-visit guarantee, and the build pipeline that closes it.",
  },
];

export function mustGetArticle(slug: string): Article {
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) throw new Error(`article registry entry missing: ${slug}`);
  return article;
}
