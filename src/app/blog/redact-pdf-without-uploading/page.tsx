import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("redact-pdf-without-uploading");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const FAQ = [
  {
    q: "Can I redact a PDF without uploading it?",
    a: "Yes. PDFAirlock's Redact tool finds and destroys the text inside your browser, then verifies its own output. The file never reaches a server, and the tool works with your wifi off.",
  },
  {
    q: "Is drawing a black box over text a redaction?",
    a: "No. The text is still in the file underneath the box and can be recovered with copy and paste or a text extractor. A real redaction removes the text from the file.",
  },
  {
    q: "How do I redact a scanned PDF?",
    a: "A scan has no text layer, so search finds nothing. Draw the boxes by hand over the areas to remove and choose Flatten mode, which rebuilds every page as an image.",
  },
  {
    q: "What does the verification report check?",
    a: "That the redacted pages contain no extractable text, that none of your search terms survive anywhere in the document, and that document metadata such as author and title has been stripped.",
  },
  {
    q: "Is the redacted PDF still searchable?",
    a: "In the default mode only the pages you marked are rebuilt as images; every other page keeps its selectable text. Flatten mode converts the whole document.",
  },
];

export default function Page() {
  return (
    <ArticleLayout article={article} faq={FAQ}>
      <p>
        Of all the PDF jobs, redaction is the strangest one to do by upload. The reason you are
        redacting is that the document contains something sensitive, and the first step of the
        popular tools is to send the whole unredacted thing to a server. Then there is the second
        problem, which is that a lot of what gets called redaction isn&apos;t.
      </p>

      <h2>A black rectangle is not a redaction</h2>
      <p>
        In 2019, a court filing by Paul Manafort&apos;s lawyers was &ldquo;redacted&rdquo; with
        black boxes. Reporters selected the blacked-out passages, pasted them into a text editor,
        and read them. In 2020 the same thing happened with the unsealed Ghislaine Maxwell
        deposition. Both were drawn over, not removed: the text sat in the file underneath the
        rectangle, exactly where a text extractor expects to find it.
      </p>
      <p>
        Real redaction destroys the content. The reliable way to do that for a page is to rebuild it
        as an image with the marked areas painted out, so the words no longer exist in any layer,
        and then to check the result rather than assume it.
      </p>

      <h2>Redacting in the browser, without an upload</h2>
      <Steps
        items={[
          "Open Redact PDF and choose the file. The first page renders in the tab.",
          "Type the name, number or phrase to remove and click Mark all matches. Every occurrence on every page gets a box. Repeat for each term; the terms are remembered for the verification step.",
          "For anything search can't see, drag on the page to draw a box. Click a box to remove it.",
          "Pick a mode. Rebuild only marked pages keeps selectable text on every untouched page; Flatten rebuilds the whole document, which is what you want for scans or when you'd rather remove every text layer.",
          "Click Redact & verify. The tool builds the output, re-opens it as if it were a stranger's file, and shows the report: zero extractable text on redacted pages, no surviving search terms, metadata stripped. If a term survived on a page you didn't mark, the report names the page.",
          "Download. Then open the file and try to select the redacted area yourself. Nothing selects, because nothing is there.",
        ]}
      />
      <p>
        <Link href="/redact-pdf" className="text-brand underline">
          Open Redact PDF →
        </Link>
      </p>

      <h2>What the verifier does and doesn&apos;t prove</h2>
      <p>
        The report proves the text layer is gone and your terms are absent from the file, and it
        confirms the metadata was stripped, which matters because author names and revision history
        leak through metadata more often than through page content. What it cannot judge is whether
        you marked the right things: if a phone number is written in a way you didn&apos;t search
        for, it is still there, in plain sight, on a page the report calls clean. Search for every
        variant you can think of, and read the output once before it leaves your hands.
      </p>

      <h2>Scans and photographed documents</h2>
      <p>
        A scanned PDF is pictures of pages. There is no text to search, so Mark all matches finds
        nothing and says so. Draw the boxes by hand, use Flatten, and check the output visually. The
        upside is that a scan has no hidden text layer to leak in the first place, unless someone
        ran OCR on it, in which case Flatten removes that too.
      </p>

      <h2>Why local matters more here than anywhere</h2>
      <p>
        An upload-based redaction service receives the unredacted document. Whatever happens next,
        retention windows, backups, logs, a breach, the sensitive version has already left your
        control. On PDFAirlock the file is opened, rebuilt and verified by code running inside your
        tab. You can watch the Network tab stay empty, you can turn off your wifi first, and you can
        read the page&apos;s Content-Security-Policy, which forbids the browser from contacting any
        host but the site itself. The{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy page
        </Link>{" "}
        lays out all three checks, and the{" "}
        <Link href="/pdf-redaction-for-law-firms" className="text-brand underline">
          note for law firms
        </Link>{" "}
        covers the professional-duty angle.
      </p>
    </ArticleLayout>
  );
}
