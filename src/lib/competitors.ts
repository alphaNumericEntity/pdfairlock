export type Competitor = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  switchReasons: string[];
  strengths: string;
  stayIf: string[];
  migration: { theirs: string; route: string; ours: string }[];
  faq: { q: string; a: string }[];
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "ilovepdf-alternative",
    name: "iLovePDF",
    metaTitle: "iLovePDF alternative with no uploads — free & works offline",
    metaDescription:
      "Looking for an iLovePDF alternative that doesn't upload your files? PDFAirlock runs every tool in your browser — merge, split, compress, redact, sign — free, no account, works offline.",
    h1: "The iLovePDF alternative that never uploads your files",
    intro:
      "iLovePDF is the biggest name in online PDF tools, and for good reason — it does almost everything. But every file you process on its web tools travels to iLovePDF's servers first. If you're here, that's probably the dealbreaker: a client contract, an HR document, or a medical record that shouldn't be uploaded anywhere, or simply fatigue with the Premium prompts. PDFAirlock does the everyday operations entirely in your browser — the file never leaves your device, and you can verify that yourself.",
    switchReasons: [
      "Your documents are confidential — uploading them to a third-party server is the problem, regardless of how quickly it's deleted",
      "You want the everyday tools free, without ads or Premium upsells mid-task",
      "You'd rather not create an account to process your own files",
      "You need tools that keep working on a plane, in a hospital, or behind a strict firewall",
    ],
    strengths:
      "Honest credit: iLovePDF has a broader toolset than we do — OCR, conversions to and from Word/Excel/PowerPoint, polished iOS/Android apps, and a desktop app. If your daily work is converting Office documents on your phone, it genuinely is the better fit today. Those features are real engineering, and web-based conversion is hard to do locally.",
    stayIf: [
      "You depend on Word/Excel/PowerPoint conversions",
      "You want a mobile app rather than a website",
      "You need OCR today (ours is on the roadmap, and it will run locally)",
    ],
    migration: [
      { theirs: "Merge PDF", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Split PDF", route: "/split-pdf", ours: "Split PDF" },
      { theirs: "Compress PDF", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "JPG to PDF", route: "/jpg-to-pdf", ours: "Images to PDF" },
      { theirs: "PDF to JPG", route: "/pdf-to-jpg", ours: "PDF to images" },
      { theirs: "Rotate PDF", route: "/rotate-pdf", ours: "Rotate PDF" },
      { theirs: "Watermark", route: "/watermark-pdf", ours: "Watermark PDF" },
      { theirs: "Page numbers", route: "/add-page-numbers", ours: "Add page numbers" },
      { theirs: "Unlock PDF", route: "/unlock-pdf", ours: "Unlock PDF" },
      { theirs: "Protect PDF", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "Sign PDF", route: "/sign-pdf", ours: "Sign PDF" },
    ],
    faq: [
      {
        q: "Does iLovePDF upload my files to its servers?",
        a: "Yes — its web tools process files server-side, which you can confirm by watching your browser's network tab during an operation. iLovePDF publishes deletion policies, but the upload itself is what confidentiality obligations often prohibit. PDFAirlock processes everything in your browser instead: same test, zero requests.",
      },
      {
        q: "Is there a free iLovePDF alternative without ads or task limits?",
        a: "PDFAirlock is completely free during its beta — every tool, no ads, no account, no daily limits. When paid licenses arrive for advanced features they'll be one-time purchases, never a subscription.",
      },
      {
        q: "Can I merge or compress PDFs offline?",
        a: "Yes. After your first visit, PDFAirlock works fully offline — load the site once, then use it in airplane mode. That's also the easiest way to prove nothing is being uploaded.",
      },
      {
        q: "What can't PDFAirlock do that iLovePDF can?",
        a: "OCR and Office-format conversions (Word, Excel, PowerPoint), plus native mobile apps. If those are your core need, iLovePDF remains the better tool for now — this page tells you that honestly.",
      },
    ],
  },
  {
    slug: "smallpdf-alternative",
    name: "Smallpdf",
    metaTitle: "Smallpdf alternative without uploads or daily limits — free",
    metaDescription:
      "A Smallpdf alternative that processes PDFs in your browser: no uploads, no account, no daily task limits. Merge, compress, redact and sign — free during beta, works offline.",
    h1: "The Smallpdf alternative with no uploads and no daily limit",
    intro:
      "Smallpdf popularised simple, pretty PDF tools — and then put the simplicity behind a meter. The free tier caps how many tasks you can run per day, most features nudge you toward Pro, and every document you process on the web tools is uploaded to Smallpdf's servers first. PDFAirlock takes the opposite shape: all fourteen tools run inside your browser, unlimited and free during beta, and your file never leaves your machine — verifiably.",
    switchReasons: [
      "You hit the free daily task limit right in the middle of a job",
      "The document is sensitive and shouldn't be uploaded at all — policy or no policy",
      "You don't want a subscription for something you do a few times a month",
      "You want to check the privacy claim yourself instead of trusting a page that says “we care about privacy”",
    ],
    strengths:
      "Honest credit: Smallpdf's e-signature workflow — sending documents to others for signature, with tracking — is a genuinely different product from drawing a signature locally, and its team/enterprise offering (SSO, admin controls, ISO-certified processes) is built for procurement departments. Our sign tool places your drawn signature on a document; it does not orchestrate multi-party signing ceremonies.",
    stayIf: [
      "Your team routes documents to other people for signature and needs tracking",
      "You're buying centrally managed seats with SSO for a company",
      "You need Office-format conversions",
    ],
    migration: [
      { theirs: "Merge PDF", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Split PDF", route: "/split-pdf", ours: "Split PDF" },
      { theirs: "Compress PDF", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "PDF to JPG", route: "/pdf-to-jpg", ours: "PDF to images" },
      { theirs: "JPG to PDF", route: "/jpg-to-pdf", ours: "Images to PDF" },
      { theirs: "Rotate PDF", route: "/rotate-pdf", ours: "Rotate PDF" },
      { theirs: "Delete PDF pages", route: "/delete-pdf-pages", ours: "Delete PDF pages" },
      { theirs: "Unlock PDF", route: "/unlock-pdf", ours: "Unlock PDF" },
      { theirs: "Protect PDF", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "eSign (self-sign)", route: "/sign-pdf", ours: "Sign PDF" },
    ],
    faq: [
      {
        q: "Does Smallpdf have a free limit?",
        a: "Smallpdf's free tier limits how many tasks you can run per day and gates several tools behind Pro. PDFAirlock has no task limits — everything is free during beta, with one-time (never subscription) licenses planned for advanced features later.",
      },
      {
        q: "Is Smallpdf safe for confidential documents?",
        a: "Smallpdf is a legitimate company with certified processes, but its web tools work by uploading your file to its servers. For documents under confidentiality obligations, the upload itself is often what's prohibited. Processing that stays in your browser sidesteps the question — and you can verify it in your network tab.",
      },
      {
        q: "Can I use PDF tools without creating an account?",
        a: "Here, yes — there are no accounts at all. Nothing to sign up for, no email required, no cookies.",
      },
    ],
  },
  {
    slug: "adobe-acrobat-alternative",
    name: "Adobe Acrobat",
    metaTitle: "Free Adobe Acrobat alternative for everyday PDF tasks",
    metaDescription:
      "Skip the Acrobat subscription for merging, compressing, signing and redacting PDFs. PDFAirlock runs these in your browser — free, no Adobe account, files never uploaded to a cloud.",
    h1: "A free Acrobat alternative for the 90% of PDF work that isn't editing",
    intro:
      "Nobody disputes what Acrobat is: the deepest PDF software ever made. But most people paying the subscription use a sliver of it — merging, compressing, rotating, signing, the occasional redaction — and Adobe's free online tools require an account and route your document through Adobe's cloud. If your workload is the everyday sliver, PDFAirlock does it in your browser: no subscription, no account, no cloud, and the redaction comes with something Acrobat doesn't show you — a verification report.",
    switchReasons: [
      "You're paying a monthly subscription for occasional merge/compress/sign work",
      "Adobe's free web tools want an account and process files in Adobe's cloud",
      "You want redaction that proves the text is gone, not just a black box UI",
      "Your machine is locked down and you can't install desktop software",
    ],
    strengths:
      "Honest credit: for true in-place text editing, form authoring, print production, PDF/A archival and professional OCR, desktop Acrobat has no real equal — including us. PDFAirlock deliberately does not edit text inside PDFs; that's a different, much deeper product. Acrobat's redaction engine is also the professional benchmark (though it keeps its working to itself — ours shows you the verification).",
    stayIf: [
      "You edit PDF text or author forms — that's Acrobat's actual moat",
      "You need PDF/A compliance or prepress tooling",
      "Your firm standardises on Acrobat for workflow integrations",
    ],
    migration: [
      { theirs: "Combine files", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Organize pages (extract)", route: "/extract-pdf-pages", ours: "Extract pages" },
      { theirs: "Organize pages (delete)", route: "/delete-pdf-pages", ours: "Delete pages" },
      { theirs: "Compress PDF", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "Fill & Sign (signature)", route: "/sign-pdf", ours: "Sign PDF" },
      { theirs: "Redact", route: "/redact-pdf", ours: "Redact PDF (with verification)" },
      { theirs: "Protect with password", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "Remove password", route: "/unlock-pdf", ours: "Unlock PDF" },
      { theirs: "Export to images", route: "/pdf-to-jpg", ours: "PDF to images" },
    ],
    faq: [
      {
        q: "Do I need Adobe Acrobat to merge or compress PDFs?",
        a: "No. Merging, splitting, compressing, rotating, signing and password-protecting are all possible free in your browser — PDFAirlock does them without an Adobe account, and without your file going to any cloud.",
      },
      {
        q: "How do I sign a PDF without an Adobe account?",
        a: "Open PDFAirlock's sign tool, draw your signature, click where it should go, download. The document and signature never leave your browser. Note this is a drawn signature (like ink), not a cryptographic digital certificate.",
      },
      {
        q: "Is there a free alternative to Acrobat's redaction?",
        a: "PDFAirlock redacts by destroying the text on redacted pages (not overlaying a box) and then re-scans its own output to prove the text, your search terms, and the metadata are gone — a verification report Acrobat doesn't give you. For legal work, always review output before distribution regardless of tool.",
      },
      {
        q: "Can PDFAirlock edit text inside a PDF like Acrobat?",
        a: "No, and honestly it isn't planned — in-place text editing is Acrobat's genuine specialty. PDFAirlock covers the everyday operations around a PDF, not authoring inside one.",
      },
    ],
  },
  {
    slug: "pdf24-alternative",
    name: "PDF24",
    metaTitle: "PDF24 alternative for Mac, Linux and every OS — local & free",
    metaDescription:
      "Like PDF24's local processing but need it beyond Windows? PDFAirlock runs entirely in the browser on any OS — Mac, Linux, ChromeOS — free, no install, files never uploaded.",
    h1: "PDF24's local privacy, without Windows or an installer",
    intro:
      "PDF24 deserves respect: its free Windows desktop app processes files locally, which makes it one of the few mainstream tools that shares our core principle. The catch is the word Windows — and the fact that PDF24's online tools, like everyone's, upload to a server. PDFAirlock brings the local-processing model to every machine with a browser: Mac, Linux, ChromeOS, a locked-down work laptop where you can't install anything. Same privacy stance, zero installation.",
    switchReasons: [
      "You're on a Mac, Linux, or ChromeOS — the PDF24 desktop app isn't",
      "You can't install software on your work machine",
      "You used PDF24's online tools assuming they were local like the app — they aren't",
      "You want verified redaction, which PDF24 doesn't offer",
    ],
    strengths:
      "Honest credit: on Windows, PDF24 Creator is a genuinely good free citizen — a large local toolset, a virtual PDF printer, and no subscription. If you're a Windows user who's happy installing software, it's a fine choice, and its local processing means our core criticism of the category doesn't apply to the desktop app.",
    stayIf: [
      "You're on Windows and prefer a desktop application",
      "You use the virtual PDF printer workflow",
      "You need its OCR today",
    ],
    migration: [
      { theirs: "Merge PDF", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Split PDF", route: "/split-pdf", ours: "Split PDF" },
      { theirs: "Compress PDF", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "Rotate pages", route: "/rotate-pdf", ours: "Rotate PDF" },
      { theirs: "Remove pages", route: "/delete-pdf-pages", ours: "Delete pages" },
      { theirs: "Extract pages", route: "/extract-pdf-pages", ours: "Extract pages" },
      { theirs: "Add watermark", route: "/watermark-pdf", ours: "Watermark PDF" },
      { theirs: "Add page numbers", route: "/add-page-numbers", ours: "Add page numbers" },
      { theirs: "Protect PDF", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "Unlock PDF", route: "/unlock-pdf", ours: "Unlock PDF" },
    ],
    faq: [
      {
        q: "Is there a PDF24 for Mac?",
        a: "PDF24's desktop app is Windows-only. PDFAirlock offers the same local-processing principle in the browser, so it works identically on macOS, Linux, ChromeOS and Windows — with nothing to install.",
      },
      {
        q: "Are PDF24's online tools private like its desktop app?",
        a: "No — the desktop app processes locally, but PDF24's online tools upload files to its servers like other web tools. PDFAirlock's web tools are local: verify with the network tab or by going offline.",
      },
      {
        q: "Is PDFAirlock really free like PDF24?",
        a: "Everything is free during beta, with no ads. The long-term plan is one-time licenses for advanced features — never a subscription.",
      },
    ],
  },
  {
    slug: "sejda-alternative",
    name: "Sejda",
    metaTitle: "Sejda alternative with no task limits or uploads — free",
    metaDescription:
      "Hit Sejda's free task limit? PDFAirlock has none: unlimited merge, split, compress, redact and sign, processed in your browser with no uploads. Free during beta, works offline.",
    h1: "The Sejda alternative with no daily task limit",
    intro:
      "Sejda is one of the more honest tools in this category — parts of it can even process files in your browser, and its pricing (day and week passes rather than only subscriptions) respects occasional users. But the free tier's task and size limits arrive fast, and knowing which tool runs locally versus on Sejda's servers takes careful reading. PDFAirlock removes both frictions: every tool is local, always, enforced by the site's security policy — and there are no limits at all during beta.",
    switchReasons: [
      "The free daily task or file-size limit keeps interrupting real work",
      "You can't tell which Sejda tools process locally and which upload — and the document is sensitive",
      "You'd rather verify privacy (network tab, wifi off) than parse a features matrix",
      "You want verified redaction with a report",
    ],
    strengths:
      "Honest credit: Sejda has a genuine in-browser PDF text editor — editing existing text in a PDF is hard, rare, and useful, and we don't do it. Its desktop app and its pass-based pricing are both user-respecting choices, and the fact that some of its web tools run client-side puts it closer to our philosophy than any other incumbent.",
    stayIf: [
      "You need to edit text inside a PDF — Sejda's editor is the draw",
      "The pass pricing model fits a one-week burst of heavy use",
    ],
    migration: [
      { theirs: "Merge", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Split", route: "/split-pdf", ours: "Split PDF" },
      { theirs: "Compress", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "Delete pages", route: "/delete-pdf-pages", ours: "Delete pages" },
      { theirs: "Rotate", route: "/rotate-pdf", ours: "Rotate PDF" },
      { theirs: "Watermark", route: "/watermark-pdf", ours: "Watermark PDF" },
      { theirs: "Sign", route: "/sign-pdf", ours: "Sign PDF" },
      { theirs: "Protect", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "Unlock", route: "/unlock-pdf", ours: "Unlock PDF" },
    ],
    faq: [
      {
        q: "What are Sejda's free limits?",
        a: "Sejda's free tier restricts tasks per day and document size, which is fair for their costs — server processing isn't free. PDFAirlock has no per-task costs because your browser does the work, so there are no task limits.",
      },
      {
        q: "Does Sejda upload my files?",
        a: "It depends on the tool — Sejda documents that some tools run in-browser while others process on its servers. PDFAirlock is simpler to reason about: everything is local, and the site's Content-Security-Policy makes server contact impossible, which you can verify yourself.",
      },
      {
        q: "Can PDFAirlock edit PDF text like Sejda?",
        a: "No — Sejda's text editor is genuinely its standout feature and we credit it. PDFAirlock covers everyday operations (merge, split, compress, redact, sign, protect) rather than in-document editing.",
      },
    ],
  },
  {
    slug: "stirling-pdf-alternative",
    name: "Stirling PDF",
    metaTitle: "Stirling PDF alternative with nothing to self-host",
    metaDescription:
      "Want Stirling PDF's privacy without running Docker? PDFAirlock processes PDFs in your browser — same files-stay-yours principle, zero servers to maintain, works offline.",
    h1: "Stirling PDF's privacy, without running a server",
    intro:
      "Stirling PDF is the self-hosting community's favourite for a reason: open source, feature-rich, and your files stay on infrastructure you control. But that last clause is also the price — a Docker host to run, update, and secure, for something many people need four times a month. PDFAirlock keeps the principle and deletes the ops: the browser is the server. Load the page once and it even works offline, on machines where you could never install or host anything.",
    switchReasons: [
      "You only wanted private PDF tools, not another container to maintain",
      "You need it on machines that can't reach your homelab — or aren't yours",
      "Colleagues or family ask for “the safe PDF thing” and a URL is deployable advice; a compose file isn't",
      "You want redaction with a built-in verification report",
    ],
    strengths:
      "Honest credit: Stirling has a larger toolset than we do, it's fully open source, and self-hosting gives you control we structurally can't match — your instance, your rules, your network, even an API to automate against. For a homelab owner who enjoys the craft, it's excellent, and its community moves fast.",
    stayIf: [
      "You already run a homelab and want everything on your own metal",
      "You need its long tail of tools (OCR, conversions, pipelines/API)",
      "Open-source auditability of the exact running code matters to you",
    ],
    migration: [
      { theirs: "Merge", route: "/merge-pdf", ours: "Merge PDF files" },
      { theirs: "Split", route: "/split-pdf", ours: "Split PDF" },
      { theirs: "Compress", route: "/compress-pdf", ours: "Compress PDF" },
      { theirs: "Rotate", route: "/rotate-pdf", ours: "Rotate PDF" },
      { theirs: "Remove pages", route: "/delete-pdf-pages", ours: "Delete pages" },
      { theirs: "Add watermark", route: "/watermark-pdf", ours: "Watermark PDF" },
      { theirs: "Add page numbers", route: "/add-page-numbers", ours: "Add page numbers" },
      { theirs: "Add password", route: "/protect-pdf", ours: "Protect PDF (AES-256)" },
      { theirs: "Remove password", route: "/unlock-pdf", ours: "Unlock PDF" },
      { theirs: "Redact (manual)", route: "/redact-pdf", ours: "Redact PDF (with verification)" },
    ],
    faq: [
      {
        q: "Do I need Docker or a server to use PDFAirlock?",
        a: "No — nothing to install or host. The whole toolkit runs in your browser tab, and after the first visit it works offline. The privacy result is similar to self-hosting: your files never touch anyone else's server.",
      },
      {
        q: "Is browser processing as private as self-hosting Stirling PDF?",
        a: "For the document, effectively yes: in both cases the file never reaches a third-party server. Self-hosting gives you more control (your code, your network); PDFAirlock gives you enforcement you can check per-visit — a Content-Security-Policy that blocks all external requests, verifiable in your network tab or by going offline.",
      },
      {
        q: "Can family or colleagues use it without setup?",
        a: "Yes — that's the point. It's a URL. No account, no install, no VPN back to your homelab.",
      },
    ],
  },
];

export function mustGetCompetitor(slug: string): Competitor {
  const competitor = COMPETITORS.find((c) => c.slug === slug);
  if (!competitor) throw new Error(`competitor registry entry missing: ${slug}`);
  return competitor;
}
