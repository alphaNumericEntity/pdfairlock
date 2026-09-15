export type FaqItem = { q: string; a: string };

export type ToolMeta = {
  slug: string;
  name: string;
  shortName: string;
  h1: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  accept: "pdf" | "pdf-multi" | "images";
  flagship?: boolean;
  steps: string[];
  useCases: { title: string; body: string }[];
  notes: string[];
  guide: string;
  faq: FaqItem[];
};

const COMMON_FAQ: FaqItem[] = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. All processing happens inside your browser using WebAssembly and JavaScript. Our server only serves the app itself — there is no endpoint that can receive files. You can verify this in your browser's network tab, or turn off your wifi after the page loads: everything still works.",
  },
  {
    q: "Does it work offline?",
    a: "Yes. After your first visit the whole app is cached by a service worker, so the page loads and every tool works with no connection at all. Load the page, switch on airplane mode, and carry on.",
  },
  {
    q: "Is there a file size limit?",
    a: "No hard limit — your device's memory is the ceiling. Files up to a few hundred MB work well on a typical laptop. Very large files may be slow or fail on low-memory devices; nothing is ever truncated silently.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. No account, no email, no cookies. The free tools are simply free.",
  },
  {
    q: "Which browsers work?",
    a: "Current Chrome, Edge, Firefox and Safari, on desktop and on phones. Phones have less memory, so very large files are better handled on a laptop.",
  },
];

export const TOOLS: ToolMeta[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF files",
    shortName: "Merge",
    h1: "Merge PDF files without uploading them",
    tagline: "Combine multiple PDFs into one — in order, in seconds, offline.",
    metaTitle: "Merge PDF files without uploading — free, offline, private",
    metaDescription:
      "Combine PDF files into one document directly in your browser. No upload, no server, no account. Works offline — your files never leave your device.",
    accept: "pdf-multi",
    steps: [
      "Drop two or more PDFs onto the page, or click to choose them.",
      "Put them in order: drag a file up or down the list, or use the arrows. The output follows the list from top to bottom.",
      "Click Merge. The combined file is assembled in your browser's memory.",
      "Download the merged PDF. Nothing was sent anywhere — you can do all of this with your wifi off.",
    ],
    useCases: [
      {
        title: "Contract plus exhibits",
        body: "A signed agreement with its schedules and annexes as one file for filing, without the whole deal passing through someone else's server.",
      },
      {
        title: "Scanned paperwork",
        body: "Invoices, receipts and forms scanned one page at a time, stitched into a single document.",
      },
      {
        title: "Application packs",
        body: "CV, cover letter and certificates as one PDF, in exactly the order the employer asked for.",
      },
    ],
    notes: [
      "The output follows the list order exactly, and each page keeps its own size, so mixed A4 and Letter files merge without cropping.",
      "A password-protected file won't merge until the password is removed — run it through Unlock PDF first.",
      "Batches are limited only by your device's memory; a few hundred megabytes is fine on a laptop.",
    ],
    guide: "merge-pdf-without-uploading",
    faq: [
      {
        q: "How do I change the order of the merged files?",
        a: "Drag files up or down in the list before merging, or use the arrow buttons. The output follows the list order exactly.",
      },
      {
        q: "Can I merge PDFs with different page sizes?",
        a: "Yes. Every page keeps its original dimensions, so an A4 report and a Letter-sized scan sit side by side in the output without scaling or cropping.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    shortName: "Split",
    h1: "Split a PDF without uploading it",
    tagline: "Split a PDF into separate files — every page, or the ranges you choose.",
    metaTitle: "Split PDF without uploading — free, offline, private",
    metaDescription:
      "Split a PDF into individual pages or extract page ranges, entirely in your browser. No upload, no account. Files never leave your device.",
    accept: "pdf",
    steps: [
      "Choose the PDF to split.",
      "Pick a mode: every page becomes its own PDF (delivered as a zip), or the page ranges you type — like 1-3, 7, 12-14 — become one new PDF.",
      "Click Split and download the result.",
    ],
    useCases: [
      {
        title: "Chapters out of a long report",
        body: "Pull each section into its own file so reviewers only open what concerns them.",
      },
      {
        title: "Batch scans",
        body: "A pile of documents scanned as one PDF, separated back into individual files.",
      },
      {
        title: "Share the relevant pages only",
        body: "Send the two pages of a contract someone actually needs instead of the whole thing.",
      },
    ],
    notes: [
      "Every-page mode names each file with its page number and packs them into a zip named after the original.",
      "Ranges accept page numbers and spans separated by commas, and the output keeps the original order.",
      "Pages are copied, not re-rendered, so text stays selectable and quality is identical to the source.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "What do I get when splitting every page?",
        a: "A zip archive containing one single-page PDF per page of the original, named with page numbers.",
      },
      {
        q: "Can I split a password-protected PDF?",
        a: "Remove the password first with Unlock PDF (you need to know it), then split the unlocked copy. Both steps happen in your browser.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF pages",
    shortName: "Extract pages",
    h1: "Extract PDF pages without uploading the file",
    tagline: "Pull specific pages out of a PDF into a new document.",
    metaTitle: "Extract pages from PDF without uploading — free & private",
    metaDescription:
      "Extract specific pages or ranges from a PDF into a new file, entirely in your browser. No upload, works offline.",
    accept: "pdf",
    steps: [
      "Choose the PDF.",
      "Type the pages you want, using numbers and ranges: 1-3, 7, 12-14.",
      "Click Extract. The pages are copied into a new PDF in their original order.",
      "Download the new file.",
    ],
    useCases: [
      {
        title: "One clause, not the whole agreement",
        body: "Send the page with the relevant term instead of a 60-page contract.",
      },
      {
        title: "The pages you need from a manual",
        body: "Keep the three pages you refer to and skip the rest.",
      },
      {
        title: "An excerpt for review",
        body: "Build a short extract for a colleague without exposing the full document.",
      },
    ],
    notes: [
      "Pages are copied as they are — text stays selectable and the quality is identical to the original.",
      "The output keeps the original page order regardless of the order you typed the ranges in.",
    ],
    guide: "edit-pdf-without-uploading",
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
    h1: "Delete PDF pages without uploading the file",
    tagline: "Remove pages from a PDF and download the cleaned-up file.",
    metaTitle: "Delete pages from PDF without uploading — free & private",
    metaDescription:
      "Remove unwanted pages from a PDF directly in your browser. No upload, no server, works offline.",
    accept: "pdf",
    steps: [
      "Choose the PDF.",
      "Type the pages to remove, like 2, 5-8.",
      "Click Delete and download the cleaned-up file. The original on your disk is untouched.",
    ],
    useCases: [
      {
        title: "Blank pages from a scan",
        body: "Double-sided scanning leaves empty pages; take them out before sending.",
      },
      {
        title: "Cover sheets and fax headers",
        body: "Drop the routing page nobody needs.",
      },
      {
        title: "Pages that shouldn't leave the building",
        body: "Remove internal notes before a document goes to a client or supplier.",
      },
    ],
    notes: [
      "The tool works on a copy in memory — your original file is never modified.",
      "Remaining pages keep their content and order; only the pages you list are dropped.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Does deleting pages renumber the printed page numbers?",
        a: "No. Printed numbers are part of the page content. If you need consistent numbering afterwards, run the result through Add page numbers.",
      },
      {
        q: "Can I delete pages from a scanned PDF?",
        a: "Yes. A scan is just pages of images, and pages are removed the same way.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    shortName: "Rotate",
    h1: "Rotate a PDF without uploading it",
    tagline: "Rotate all pages or specific pages by 90°, 180°, or 270°.",
    metaTitle: "Rotate PDF without uploading — free, offline, private",
    metaDescription:
      "Rotate PDF pages in your browser and save the result. No upload, no account, works offline.",
    accept: "pdf",
    steps: [
      "Choose one PDF, or several to rotate in one go.",
      "Pick the rotation: 90° clockwise, 180°, or 90° counter-clockwise.",
      "Apply it to all pages, or list specific ones like 2, 5-8.",
      "Click Rotate and download each file, or all of them as a zip.",
    ],
    useCases: [
      {
        title: "Sideways scans",
        body: "Pages that came off the scanner rotated, fixed in one pass.",
      },
      {
        title: "Landscape tables",
        body: "Turn a wide table the right way up so it reads in a normal viewer.",
      },
      {
        title: "A folder of forms",
        body: "Choose all of them at once and rotate them together.",
      },
    ],
    notes: [
      "Rotation is stored as a page attribute, so nothing is re-rendered and the quality is unchanged.",
      "Several files can be processed in one run and downloaded individually or as a zip.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Will rotating reduce the quality?",
        a: "No. The page content is untouched; the PDF simply records a new rotation for the page, exactly as desktop tools do.",
      },
      {
        q: "Can I rotate just one page?",
        a: "Yes. Choose Specific pages and type its number. Ranges like 2, 5-8 work too.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    shortName: "Compress",
    h1: "Compress a PDF without uploading it",
    tagline: "Shrink scanned PDFs dramatically — everything stays on your device.",
    metaTitle: "Compress PDF without uploading — free, offline, private",
    metaDescription:
      "Reduce PDF file size locally in your browser. Ideal for scanned documents. No upload, no server — files never leave your device.",
    accept: "pdf",
    steps: [
      "Choose one or more PDFs.",
      "Pick a level. Strong (96 DPI) gives the smallest file, Balanced (144 DPI) suits most scans, Light (200 DPI) keeps fine detail, and Lossless only tidies the file structure so text stays selectable.",
      "Click Compress. The before and after size is shown for every file before you download.",
    ],
    useCases: [
      {
        title: "Email attachment limits",
        body: "A 40 MB scan that has to get under a mail server's cap.",
      },
      {
        title: "Portals with size caps",
        body: "Court, government and university upload forms that reject anything over a few megabytes.",
      },
      {
        title: "Archives",
        body: "Years of scanned records that take far more space than they need to.",
      },
    ],
    notes: [
      "Strong, Balanced and Light re-render every page as an image, like a good scan, so text is no longer selectable. Lossless keeps the text but gains far less.",
      "Scanned documents typically shrink 5–15×; digitally created PDFs with little imagery compress much less.",
      "Each file's before and after size is shown, so you can try another level before downloading.",
    ],
    guide: "edit-pdf-without-uploading",
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
    h1: "Redact a PDF without uploading it",
    tagline: "True redaction — text is destroyed, not hidden. With a verification report.",
    metaTitle: "Redact PDF without uploading — true redaction, verified, private",
    metaDescription:
      "Permanently remove sensitive text from PDFs in your browser. Real redaction (not a black box overlay), verified after processing. No upload — ever.",
    accept: "pdf",
    flagship: true,
    steps: [
      "Choose the PDF. The first page renders so you can see what you're working with.",
      "Type a name, number or phrase and click Mark all matches: every occurrence on every page gets a box. Or drag on the page to draw boxes by hand, which is what you'll do for scans.",
      "Choose a mode: rebuild only the marked pages (other pages keep their selectable text), or flatten the whole document.",
      "Click Redact & verify. The tool re-opens its own output, checks the text is really gone, and shows you the report before you download.",
    ],
    useCases: [
      {
        title: "Court filings and discovery",
        body: "Names, account numbers and addresses that must not appear in the public record.",
      },
      {
        title: "HR and medical records",
        body: "Sharing a file with one person's details removed, without the whole record leaving your machine.",
      },
      {
        title: "Documents for suppliers or journalists",
        body: "Hand over the substance and keep the identifying details.",
      },
    ],
    notes: [
      "Redacted pages are rebuilt as images. In the default mode every other page keeps its text; Flatten converts the whole document.",
      "Document metadata — title, author, XMP — is stripped from the output as part of the run.",
      "A scanned PDF has no text layer, so search finds nothing there; draw the boxes by hand and use Flatten.",
    ],
    guide: "redact-pdf-without-uploading",
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
    h1: "Sign a PDF without uploading it",
    tagline: "Draw your signature and place it on any page. Nothing is uploaded.",
    metaTitle: "Sign PDF without uploading — free, offline, private",
    metaDescription:
      "Draw a signature and place it on your PDF, entirely in your browser. No upload, no account — ideal for sensitive contracts.",
    accept: "pdf",
    steps: [
      "Choose the PDF you need to sign.",
      "Draw your signature with a mouse, trackpad or finger.",
      "Go to the right page, place the signature where it belongs and pick a size.",
      "Click Sign and download the signed copy.",
    ],
    useCases: [
      {
        title: "Contracts and NDAs",
        body: "Sign the agreement you were sent without handing the whole thing to an e-signature service.",
      },
      {
        title: "Consent and intake forms",
        body: "Medical, school and rental forms that carry personal details.",
      },
      {
        title: "Approvals and sign-offs",
        body: "Quotes, timesheets and internal approvals that just need a signature on a page.",
      },
    ],
    notes: [
      "The signature is a drawn image — the same standing as printing, signing and scanning — not a cryptographic certificate.",
      "You can place it on any page and set the size before applying.",
    ],
    guide: "sign-pdf-without-uploading",
    faq: [
      {
        q: "Is this a legally binding e-signature?",
        a: "This adds a drawn signature image to the document — the same as printing, signing, and scanning. It does not add a cryptographic digital-signature certificate. For many everyday agreements a drawn signature is exactly what's asked for; for regulated workflows, check what your counterparty requires.",
      },
      {
        q: "Can I sign on my phone?",
        a: "Yes. Draw with your finger, place the signature, and download. Nothing is uploaded from the phone either.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    shortName: "Unlock",
    h1: "Remove a PDF password without uploading the file",
    tagline: "Remove a password you know — the password never leaves your device.",
    metaTitle: "Remove PDF password without uploading — free & private",
    metaDescription:
      "Unlock a password-protected PDF entirely in your browser. Neither the file nor the password is ever sent anywhere. Free, no account.",
    accept: "pdf",
    steps: [
      "Choose the protected PDF.",
      "Type the password you open it with. If the file opens without one but blocks printing or copying, leave the box empty.",
      "Click Unlock and download a copy with the protection removed.",
    ],
    useCases: [
      {
        title: "Your own protected statements",
        body: "Bank and payslip PDFs that arrive locked with a password you're tired of typing.",
      },
      {
        title: "Files sent with a shared password",
        body: "Remove the password once so the file can be filed with the rest.",
      },
      {
        title: "Print and copy restrictions",
        body: "Documents you own that refuse to print — these unlock with an empty password.",
      },
    ],
    notes: [
      "This works for files you can legitimately open. It does not recover forgotten passwords.",
      "Decryption is done by qpdf compiled to WebAssembly, running in the page; neither the file nor the password is transmitted.",
    ],
    guide: "edit-pdf-without-uploading",
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
    h1: "Password-protect a PDF without uploading it",
    tagline: "Add AES-256 password protection — without the file going anywhere.",
    metaTitle: "Password-protect PDF without uploading — AES-256, free & private",
    metaDescription:
      "Add a password to a PDF with AES-256 encryption, entirely in your browser. The file and password never leave your device.",
    accept: "pdf",
    steps: [
      "Choose the PDF.",
      "Type a password and confirm it.",
      "Click Protect. The file is encrypted with AES-256 and you download the protected copy.",
    ],
    useCases: [
      {
        title: "Payslips, tax documents, medical results",
        body: "Anything you email that you wouldn't want read if the mailbox is breached.",
      },
      {
        title: "Board papers and drafts",
        body: "Protected with a password shared over a different channel.",
      },
      {
        title: "Files on shared drives",
        body: "A second lock for documents that sit where many people can browse.",
      },
    ],
    notes: [
      "Encryption is AES-256, the strongest the PDF standard supports, applied by qpdf compiled to WebAssembly.",
      "There is no reset. We never see the password, so if you lose it the file stays locked — keep it in a password manager.",
    ],
    guide: "edit-pdf-without-uploading",
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
    h1: "Convert JPG to PDF without uploading your images",
    tagline: "Turn JPG and PNG images into a single PDF, in the order you choose.",
    metaTitle: "Convert JPG to PDF without uploading — free, offline, private",
    metaDescription:
      "Combine JPG and PNG images into one PDF directly in your browser. No upload, no watermarks, works offline.",
    accept: "images",
    steps: [
      "Choose your JPG or PNG files.",
      "Put them in order; each image becomes one page.",
      "Pick a page size: match each image exactly, or A4 with margins.",
      "Click Convert and download the PDF.",
    ],
    useCases: [
      {
        title: "Photographed receipts and IDs",
        body: "Phone photos of documents as one tidy PDF for an expense claim or an application.",
      },
      {
        title: "Whiteboard photos",
        body: "A meeting's whiteboards as a single document to circulate.",
      },
      {
        title: "Pages scanned with a phone camera",
        body: "Photos of a paper form combined into one file in reading order.",
      },
    ],
    notes: [
      "Match each image keeps every pixel at its native size; A4 adds a half-inch margin and scales the image to fit the page.",
      "Images are embedded as they are, so a JPG is not re-compressed on the way in.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Are my photos re-compressed?",
        a: "No. Each JPG or PNG is embedded in the PDF as it is. If the PDF ends up large, run it through Compress PDF afterwards.",
      },
      {
        q: "What order will the pages be in?",
        a: "The order of the list. Drag or use the arrows to rearrange before converting.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to images",
    shortName: "PDF → JPG",
    h1: "Convert PDF to JPG without uploading it",
    tagline: "Export every page of a PDF as a high-quality JPG image.",
    metaTitle: "Convert PDF to JPG without uploading — free, offline, private",
    metaDescription:
      "Turn PDF pages into JPG images locally in your browser. Choose resolution, download as a zip. No upload, no account.",
    accept: "pdf",
    steps: [
      "Choose the PDF.",
      "Pick a resolution: 72 DPI for screens, 150 DPI for sharp images, 300 DPI for print.",
      "Click Convert. A single page gives you one JPG; a longer document comes as a zip with one JPG per page.",
    ],
    useCases: [
      {
        title: "Slides into images",
        body: "Pages of a deck as pictures for a post or a presentation tool that won't take PDFs.",
      },
      {
        title: "A page for a website",
        body: "One page as an image where a PDF embed would be clumsy.",
      },
      {
        title: "Thumbnails",
        body: "Quick previews of every page at 72 DPI.",
      },
    ],
    notes: [
      "300 DPI of an A4 page is about 2480 × 3508 pixels, so expect large files at that setting.",
      "Multi-page output is a zip named after the original, with one JPG per page.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Which resolution should I pick?",
        a: "72 DPI for anything shown on a screen, 150 DPI when you want crisp text in the image, 300 DPI if the image will be printed.",
      },
      {
        q: "Do I get one file per page?",
        a: "Yes. One page downloads as a single JPG; more than one page comes as a zip containing one JPG per page.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "watermark-pdf",
    name: "Watermark PDF",
    shortName: "Watermark",
    h1: "Watermark a PDF without uploading it",
    tagline: "Stamp CONFIDENTIAL, DRAFT, or any text across every page.",
    metaTitle: "Add watermark to PDF without uploading — free & private",
    metaDescription:
      "Add a text watermark to every page of a PDF in your browser. No upload, no server, works offline.",
    accept: "pdf",
    steps: [
      "Choose one or more PDFs.",
      "Type the watermark text — CONFIDENTIAL, DRAFT, a client name — and pick gray or red.",
      "Click Apply. The text is stamped diagonally across every page at 25% opacity.",
      "Download the files.",
    ],
    useCases: [
      {
        title: "Drafts and confidential material",
        body: "Make the status obvious on every page before a document circulates.",
      },
      {
        title: "Samples and proofs",
        body: "Mark preview copies so they aren't mistaken for the final version.",
      },
      {
        title: "Internal documents leaving the building",
        body: "Stamp who a copy was prepared for, so leaks have a name on them.",
      },
    ],
    notes: [
      "The stamp is 60 pt text at 25% opacity, rotated 40°, drawn on every page.",
      "It's drawn into the page content rather than added as an annotation, so a viewer can't simply toggle it off.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Can the watermark be removed later?",
        a: "Not with a click — it is part of the page content, not an annotation. A determined person can still crop or re-render pages, so treat a watermark as a label, not as security.",
      },
      {
        q: "Can I choose where the watermark goes?",
        a: "Not yet. It is placed diagonally across the centre of every page, which is what most people want for DRAFT and CONFIDENTIAL stamps.",
      },
      ...COMMON_FAQ,
    ],
  },
  {
    slug: "add-page-numbers",
    name: "Add page numbers",
    shortName: "Page numbers",
    h1: "Add page numbers to a PDF without uploading it",
    tagline: "Number every page of your PDF, centered at the bottom.",
    metaTitle: "Add page numbers to PDF without uploading — free & private",
    metaDescription:
      "Add page numbers to a PDF directly in your browser. No upload, no account, works offline.",
    accept: "pdf",
    steps: [
      "Choose one or more PDFs.",
      "Click Add page numbers. Each page gets its number centred at the bottom.",
      "Download the numbered files.",
    ],
    useCases: [
      {
        title: "Court bundles and bound reports",
        body: "Consistent numbering across a document assembled from many sources.",
      },
      {
        title: "Merged documents",
        body: "Files combined with Merge PDF whose original numbering no longer makes sense.",
      },
      {
        title: "Handouts for printing",
        body: "So a dropped stack can be put back in order.",
      },
    ],
    notes: [
      "Numbers are drawn into the page content, centred at the bottom of every page, starting at 1.",
      "Several files can be numbered in one run.",
    ],
    guide: "edit-pdf-without-uploading",
    faq: [
      {
        q: "Can I change where the numbers go or how they look?",
        a: "Not yet — numbers are centred at the bottom in a plain font, which suits most documents. If you need a specific style, tell us; it's on the list.",
      },
      {
        q: "Does numbering start at 1?",
        a: "Yes, on the first page of the file. Number after merging or deleting pages so the sequence matches the final document.",
      },
      ...COMMON_FAQ,
    ],
  },
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
