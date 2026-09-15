import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("edit-pdf-without-uploading");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const FAQ = [
  {
    q: "Can I edit a PDF without uploading it to a server?",
    a: "Yes, for every job on this page: signing, redacting, reordering, rotating, deleting pages, watermarking, numbering, compressing and password changes all run inside your browser on PDFAirlock, and you can do them with your wifi off. Changing the printed words themselves needs a desktop editor such as LibreOffice Draw.",
  },
  {
    q: "How do I know a free online PDF editor really doesn't upload my file?",
    a: "Open the browser's developer tools, go to the Network tab, run the tool and look for a request that carries your file. Then turn off your wifi and try again; a genuinely local tool keeps working. Claims in a privacy policy are not evidence, network traffic is.",
  },
  {
    q: "Can I edit a scanned PDF?",
    a: "A scan is a picture of a page, so there is no text to search or select. You can still rotate, reorder, delete, sign, watermark, compress and redact it, but redaction boxes have to be drawn by hand, and the redaction mode should be Flatten.",
  },
  {
    q: "Is there a file size limit?",
    a: "Only your device's memory. A few hundred megabytes is fine on a laptop; phones have less headroom.",
  },
  {
    q: "Does it cost anything?",
    a: "No. Every tool on PDFAirlock is free while it's in beta, with no account and no watermark.",
  },
];

export default function Page() {
  return (
    <ArticleLayout article={article} faq={FAQ}>
      <p>
        &ldquo;I need to edit this PDF&rdquo; almost never means changing the words. It means
        signing it, blacking something out, taking a page out, turning a page the right way up,
        stamping it DRAFT, numbering it, or getting it under an attachment limit. Every one of those
        can be done in your browser with the file staying on your machine. The one job that
        can&apos;t, editing the text itself, gets an honest answer at the end.
      </p>
      <p>
        Why does it matter where the work happens? Because the tools that show up first for
        &ldquo;edit PDF online&rdquo; take your file onto their servers, do the job there, and
        promise to delete it later. For a lease, a medical letter, a contract with someone
        else&apos;s name on it, that promise is the whole security model. The tools below never
        receive the file, so there is nothing to promise.
      </p>

      <h2>Sign it</h2>
      <p>
        The most common &ldquo;edit&rdquo; of all. On{" "}
        <Link href="/sign-pdf" className="text-brand underline">
          Sign PDF
        </Link>{" "}
        you draw your signature with a mouse, trackpad or finger, pick the page, place it and set
        the size. What you get is a drawn signature, the same standing as print-sign-scan, which is
        what most agreements ask for. If the other side needs a certificate-backed digital
        signature, that is a different product; the{" "}
        <Link href="/blog/sign-pdf-without-uploading" className="text-brand underline">
          signing guide
        </Link>{" "}
        explains the line.
      </p>

      <h2>Black something out</h2>
      <p>
        This is the edit people get wrong most often, because a black rectangle drawn over text is
        not a redaction: the text is still in the file and comes straight back out with copy and
        paste.{" "}
        <Link href="/redact-pdf" className="text-brand underline">
          Redact PDF
        </Link>{" "}
        searches for the name or number, marks every occurrence, rebuilds the affected pages so the
        text no longer exists, then re-opens its own output and shows you a verification report. For
        scans, draw the boxes by hand.{" "}
        <Link href="/blog/redact-pdf-without-uploading" className="text-brand underline">
          The redaction guide
        </Link>{" "}
        covers the details and the famous failures.
      </p>

      <h2>Take pages out, pull pages out, put pages in order</h2>
      <p>Three tools, one syntax for pages: numbers and ranges like 1-3, 7, 12-14.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <Link href="/delete-pdf-pages" className="text-brand underline">
            Delete pages
          </Link>{" "}
          removes the blanks, the fax header, the internal note.
        </li>
        <li>
          <Link href="/extract-pdf-pages" className="text-brand underline">
            Extract pages
          </Link>{" "}
          copies just the pages you list into a new file, quality untouched.
        </li>
        <li>
          <Link href="/merge-pdf" className="text-brand underline">
            Merge
          </Link>{" "}
          combines files in the order you set, and{" "}
          <Link href="/split-pdf" className="text-brand underline">
            Split
          </Link>{" "}
          does the reverse.
        </li>
      </ul>

      <h2>Turn pages the right way up</h2>
      <p>
        <Link href="/rotate-pdf" className="text-brand underline">
          Rotate PDF
        </Link>{" "}
        turns all pages or the ones you list by 90° either way or 180°. Rotation is recorded as a
        page attribute, so nothing is re-rendered and a scan looks exactly as it did. You can hand
        it a whole folder of sideways forms at once.
      </p>

      <h2>Stamp it and number it</h2>
      <p>
        <Link href="/watermark-pdf" className="text-brand underline">
          Watermark
        </Link>{" "}
        writes DRAFT, CONFIDENTIAL or a client&apos;s name diagonally across every page, drawn into
        the page content so a viewer can&apos;t toggle it off.{" "}
        <Link href="/add-page-numbers" className="text-brand underline">
          Add page numbers
        </Link>{" "}
        numbers every page at the bottom, which is the step people forget after merging a bundle
        together.
      </p>

      <h2>Make it smaller</h2>
      <p>
        <Link href="/compress-pdf" className="text-brand underline">
          Compress PDF
        </Link>{" "}
        re-renders scanned pages at a resolution you choose and typically takes a scan down 5 to 15
        times. It tells you the before and after size for each file, and it tells you the thing most
        compressors hide: in the image-based modes the text stops being selectable, and there is a
        Lossless mode if you need to keep it.
      </p>

      <h2>Lock it or unlock it</h2>
      <p>
        <Link href="/protect-pdf" className="text-brand underline">
          Protect PDF
        </Link>{" "}
        adds AES-256 encryption with a password you choose;{" "}
        <Link href="/unlock-pdf" className="text-brand underline">
          Unlock PDF
        </Link>{" "}
        removes a password you know. Both run qpdf compiled to WebAssembly inside the page, which is
        the point: the one thing you should never type into an upload form is the password to a file
        you just uploaded.
      </p>

      <h2>Changing the actual words</h2>
      <p>
        PDFAirlock does not edit text inside a PDF. We would rather say so than ship a half-working
        editor. If the job really is &ldquo;fix a typo in the body text&rdquo;, the reliable
        no-upload options are desktop programs:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-ink">LibreOffice Draw</strong> (free, Windows/Mac/Linux) opens a
          PDF with every text run as an editable box. Layout can shift a little on complex pages,
          but it is real editing, offline.
        </li>
        <li>
          <strong className="text-ink">Microsoft Word</strong> converts the PDF into a document on
          open. Good for simple documents, rough on anything designed.
        </li>
        <li>
          <strong className="text-ink">macOS Preview</strong> annotates, signs and rearranges, but
          does not change existing text.
        </li>
      </ul>
      <p>
        If you only need the words to be covered rather than changed, that is redaction, and it is
        the one case where an image-based rebuild is exactly right.
      </p>

      <h2>How to check any tool is really local</h2>
      <Steps
        items={[
          "Open the tool page, then open your browser's developer tools and switch to the Network tab.",
          "Run the job. Look for a request whose size matches your file, or any request to a host that isn't the site itself. On PDFAirlock there are none; the page's security policy (connect-src 'self') forbids them.",
          "Turn off your wifi and run the job again. A local tool keeps working. An upload tool fails at the first step.",
        ]}
      />
      <p>
        That test takes a minute and it is worth doing once for any site you plan to trust with real
        documents. Our own{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy page
        </Link>{" "}
        walks through what it does and doesn&apos;t protect you from.
      </p>
    </ArticleLayout>
  );
}
