export type ToolMeta = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  accept: "pdf" | "pdf-multi" | "images";
  flagship?: boolean;
  faq: { q: string; a: string }[];
};

const COMMON_FAQ: { q: string; a: string }[] = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. All processing happens inside your browser using WebAssembly and JavaScript. Our server only serves the app itself — there is no endpoint that can receive files. You can verify this in your browser's network tab, or turn off your wifi after the page loads: everything still works.",
  },
  {
    q: "Is there a file size limit?",
    a: "No hard limit — your device's memory is the ceiling. Files up to a few hundred MB work well on a typical laptop. Very large files may be slow or fail on low-memory devices; nothing is ever truncated silently.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. No account, no email, no cookies. The free tools are simply free.",
  },
];

export const TOOLS: ToolMeta[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF files",
    shortName: "Merge",
    tagline: "Combine multiple PDFs into one — in order, in seconds, offline.",
    metaTitle: "Merge PDF files without uploading — free, offline, private",
    metaDescription:
      "Combine PDF files into one document directly in your browser. No upload, no server, no account. Works offline — your files never leave your device.",
    accept: "pdf-multi",
    faq: [
      {
        q: "How do I change the order of the merged files?",
        a: "Drag files up or down in the list before merging, or use the arrow buttons. The output follows the list order exactly.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    shortName: "Split",
    tagline: "Split a PDF into separate files — every page, or the ranges you choose.",
    metaTitle: "Split PDF without uploading — free, offline, private",
    metaDescription:
      "Split a PDF into individual pages or extract page ranges, entirely in your browser. No upload, no account. Files never leave your device.",
    accept: "pdf",
    faq: [
      {
        q: "What do I get when splitting every page?",
        a: "A zip archive containing one single-page PDF per page of the original, named with page numbers.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF pages",
    shortName: "Extract pages",
    tagline: "Pull specific pages out of a PDF into a new document.",
    metaTitle: "Extract pages from PDF without uploading — free & private",
    metaDescription:
      "Extract specific pages or ranges from a PDF into a new file, entirely in your browser. No upload, works offline.",
    accept: "pdf",
    faq: [
      {
        q: "How do I specify pages?",
        a: 'Use page numbers and ranges separated by commas, e.g. "1-3, 7, 12-14". Pages are 1-indexed, and the output preserves the original order.',
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "delete-pdf-pages",
    name: "Delete PDF pages",
    shortName: "Delete pages",
    tagline: "Remove pages from a PDF and download the cleaned-up file.",
    metaTitle: "Delete pages from PDF without uploading — free & private",
    metaDescription:
      "Remove unwanted pages from a PDF directly in your browser. No upload, no server, works offline.",
    accept: "pdf",
    faq: COMMON_FAQ,
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    shortName: "Rotate",
    tagline: "Rotate all pages or specific pages by 90°, 180°, or 270°.",
    metaTitle: "Rotate PDF without uploading — free, offline, private",
    metaDescription:
      "Rotate PDF pages in your browser and save the result. No upload, no account, works offline.",
    accept: "pdf",
    faq: COMMON_FAQ,
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress",
    tagline: "Shrink scanned PDFs dramatically — everything stays on your device.",
    metaTitle: "Compress PDF without uploading — free, offline, private",
    metaDescription:
      "Reduce PDF file size locally in your browser. Ideal for scanned documents. No upload, no server — files never leave your device.",
    accept: "pdf",
    faq: [
      {
        q: "How much smaller will my PDF get?",
        a: "Scanned documents typically shrink 5–15×. The compressor re-renders pages as optimized images, so results depend on content and the level you pick. The before/after size is shown before you download.",
      },
      {
        q: "Will text still be selectable after compression?",
        a: "In Strong/Balanced/Light mode, pages are re-rendered as images, so text is no longer selectable — like a good scan. For digitally-created PDFs where you need selectable text, use Lossless mode (smaller gains, structure-level cleanup only). We tell you this before you run it because most tools don't.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "redact-pdf",
    name: "Redact PDF",
    shortName: "Redact",
    tagline: "True redaction — text is destroyed, not hidden. With a verification report.",
    metaTitle: "Redact PDF without uploading — true redaction, verified, private",
    metaDescription:
      "Permanently remove sensitive text from PDFs in your browser. Real redaction (not a black box overlay), verified after processing. No upload — ever.",
    accept: "pdf",
    flagship: true,
    faq: [
      {
        q: "How is this different from drawing a black rectangle?",
        a: "Most tools draw a black box over the text — the text is still in the file and can be copied out. This has caused real legal scandals. PDFAirlock rebuilds redacted pages so the underlying text ceases to exist, then re-scans the output to prove it and shows you the verification report.",
      },
      {
        q: "What does the verification report check?",
        a: "Three things: redacted pages contain zero extractable text, your search terms no longer appear anywhere in the document — if one survives on a page you didn't mark, the report names that page — and document metadata (author, title, XMP) has been stripped.",
      },
      {
        q: "Is redacting confidential documents in a browser safe?",
        a: "That's the point of this tool: the document never leaves your device. There is no server to trust. Load the page, turn off your wifi, and redact — it works, and you can watch the network tab stay empty.",
      },
      ...COMMON_FAQ.slice(1),
    ],
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    shortName: "Sign",
    tagline: "Draw your signature and place it on any page. Nothing is uploaded.",
    metaTitle: "Sign PDF without uploading — free, offline, private",
    metaDescription:
      "Draw a signature and place it on your PDF, entirely in your browser. No upload, no account — ideal for sensitive contracts.",
    accept: "pdf",
    faq: [
      {
        q: "Is this a legally binding e-signature?",
        a: "This adds a drawn signature image to the document — the same as printing, signing, and scanning. It does not add a cryptographic digital-signature certificate. For many everyday agreements a drawn signature is exactly what's asked for; for regulated workflows, check what your counterparty requires.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    shortName: "Unlock",
    tagline: "Remove a password you know — the password never leaves your device.",
    metaTitle: "Remove PDF password without uploading — free & private",
    metaDescription:
      "Unlock a password-protected PDF entirely in your browser. Neither the file nor the password is ever sent anywhere. Free, no account.",
    accept: "pdf",
    faq: [
      {
        q: "Is it safe to type the password here?",
        a: "Yes — that's the point of this tool. Both the file and the password are processed in your browser's memory only. Upload-based unlock tools receive your password on their servers; here there is no server to receive it. Verify with your network tab, or go offline first.",
      },
      {
        q: "Can this crack a password I don't know?",
        a: "No. This tool removes protection from files you can legitimately open — you need the password (or the file must be restriction-locked only, without an open password). It is not a password recovery tool.",
      },
      ...COMMON_FAQ.slice(1),
    ],
  },
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    shortName: "Protect",
    tagline: "Add AES-256 password protection — without the file going anywhere.",
    metaTitle: "Password-protect PDF without uploading — AES-256, free & private",
    metaDescription:
      "Add a password to a PDF with AES-256 encryption, entirely in your browser. The file and password never leave your device.",
    accept: "pdf",
    faq: [
      {
        q: "What encryption is used?",
        a: "AES-256, the strongest encryption the PDF standard supports, applied by qpdf — the same open-source engine used in professional PDF pipelines — compiled to WebAssembly and running in your browser.",
      },
      {
        q: "What happens if I forget the password?",
        a: "The file is genuinely encrypted, and we never see or store anything — there is no reset. Keep the password somewhere safe, like a password manager.",
      },
      ...COMMON_FAQ.slice(1),
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "Images to PDF",
    shortName: "JPG → PDF",
    tagline: "Turn JPG and PNG images into a single PDF, in the order you choose.",
    metaTitle: "Convert JPG to PDF without uploading — free, offline, private",
    metaDescription:
      "Combine JPG and PNG images into one PDF directly in your browser. No upload, no watermarks, works offline.",
    accept: "images",
    faq: COMMON_FAQ,
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to images",
    shortName: "PDF → JPG",
    tagline: "Export every page of a PDF as a high-quality JPG image.",
    metaTitle: "Convert PDF to JPG without uploading — free, offline, private",
    metaDescription:
      "Turn PDF pages into JPG images locally in your browser. Choose resolution, download as a zip. No upload, no account.",
    accept: "pdf",
    faq: COMMON_FAQ,
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    shortName: "Watermark",
    tagline: "Stamp CONFIDENTIAL, DRAFT, or any text across every page.",
    metaTitle: "Add watermark to PDF without uploading — free & private",
    metaDescription:
      "Add a text watermark to every page of a PDF in your browser. No upload, no server, works offline.",
    accept: "pdf",
    faq: COMMON_FAQ,
  },
  {
    slug: "add-page-numbers",
    name: "Add page numbers",
    shortName: "Page numbers",
    tagline: "Number every page of your PDF, centered at the bottom.",
    metaTitle: "Add page numbers to PDF without uploading — free & private",
    metaDescription:
      "Add page numbers to a PDF directly in your browser. No upload, no account, works offline.",
    accept: "pdf",
    faq: COMMON_FAQ,
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
