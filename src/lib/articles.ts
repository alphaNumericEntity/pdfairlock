export type Article = {
  slug: string;
  kind: "guide" | "engineering";
  title: string;
  metaTitle: string;
  metaDescription: string;
  date: string;
  blurb: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "edit-pdf-without-uploading",
    kind: "guide",
    title: "How to edit a PDF without uploading it",
    metaTitle: "How to edit a PDF without uploading it (2026 guide)",
    metaDescription:
      "Sign, redact, reorder, rotate, watermark, number and compress a PDF entirely in your browser, with nothing uploaded. Plus what to use when you need to change the actual words.",
    date: "2026-09-15",
    blurb:
      "Most 'edit a PDF' jobs are one of seven things, and all seven can be done in your browser without the file leaving your machine. Which tool for which job, and the honest answer on editing the text itself.",
  },
  {
    slug: "merge-pdf-without-uploading",
    kind: "guide",
    title: "How to merge PDFs without uploading them",
    metaTitle: "How to merge PDFs without uploading them — free, in your browser",
    metaDescription:
      "Combine PDF files into one without sending them to a server: a two-minute walkthrough, how to check nothing was uploaded, and the built-in options on Mac and Windows.",
    date: "2026-09-15",
    blurb:
      "Merging is the most common reason people upload confidential paperwork to a stranger's server. It doesn't need one. Step by step, with the checks that prove it.",
  },
  {
    slug: "redact-pdf-without-uploading",
    kind: "guide",
    title: "How to redact a PDF without uploading it",
    metaTitle: "How to redact a PDF without uploading it — and prove the text is gone",
    metaDescription:
      "Real redaction destroys the text; a black box only hides it. How to redact a PDF in your browser with nothing uploaded, verify the output, and avoid the copy-paste leaks that made headlines.",
    date: "2026-09-15",
    blurb:
      "Uploading a document to redact it is backwards: the whole point is that the contents are sensitive. How to do it locally, and why a black rectangle is not a redaction.",
  },
  {
    slug: "sign-pdf-without-uploading",
    kind: "guide",
    title: "How to sign a PDF without uploading it",
    metaTitle: "How to sign a PDF without uploading it — no account, no upload",
    metaDescription:
      "Put your signature on a contract or form entirely in your browser: draw it, place it, download. What a drawn signature is and isn't, and when you actually need a certificate.",
    date: "2026-09-15",
    blurb:
      "A signature page shouldn't cost you an account and a copy of the contract on someone's server. The local way, and the honest line between a drawn signature and a digital certificate.",
  },
  {
    slug: "csp-blocks-webassembly",
    kind: "engineering",
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
    kind: "engineering",
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
    kind: "engineering",
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
