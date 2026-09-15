import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("merge-pdf-without-uploading");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const FAQ = [
  {
    q: "Can I merge PDFs without uploading them anywhere?",
    a: "Yes. PDFAirlock's Merge tool combines the files inside your browser; the site has no upload endpoint and the page works with your wifi off. macOS Preview can also merge locally; Windows has no built-in merge.",
  },
  {
    q: "Does the order of pages change?",
    a: "No. The output follows your file list from top to bottom, and each file's pages keep their original order and size.",
  },
  {
    q: "Can I merge a password-protected PDF?",
    a: "Remove the password first with Unlock PDF, using the password you already know, then merge the unlocked copy. Both steps stay in your browser.",
  },
  {
    q: "Is there a limit on the number or size of files?",
    a: "No fixed limit. Your device's memory is the ceiling; a few hundred megabytes in one go is fine on a laptop.",
  },
  {
    q: "Is it free?",
    a: "Yes, with no account, no watermark and no file quota while PDFAirlock is in beta.",
  },
];

export default function Page() {
  return (
    <ArticleLayout article={article} faq={FAQ}>
      <p>
        Merging is the PDF job people do most, and the one they most often do by handing
        confidential paperwork to a website they found ten seconds earlier. The signed contract, the
        scanned passport, the payslips for the mortgage application, all uploaded to a server whose
        privacy policy says the files are deleted after a while. Maybe they are. You have no way to
        check, and no way to find out if they weren&apos;t.
      </p>
      <p>
        None of that is necessary. A PDF is just a file, and combining two of them is well within
        what a browser can do on its own. Here is how, followed by how to prove nothing left your
        machine.
      </p>

      <h2>Merging in the browser, without an upload</h2>
      <Steps
        items={[
          "Open Merge PDF. The page loads once and from then on works even with the network off.",
          "Drop your PDFs onto the page or click to choose them. They appear in a list with their sizes.",
          "Put them in order: drag a file up or down, or use the arrows. The output follows this list exactly.",
          "Click Merge. The combined document is assembled in memory by pdf-lib, an open-source PDF library running inside the page.",
          "Download the result. Your originals on disk are untouched.",
        ]}
      />
      <p>
        <Link href="/merge-pdf" className="text-brand underline">
          Open Merge PDF →
        </Link>
      </p>

      <h2>Things worth knowing before you merge</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-ink">Mixed page sizes are fine.</strong> Every page keeps its own
          dimensions, so an A4 report and a Letter-sized scan sit next to each other with nothing
          scaled or cropped.
        </li>
        <li>
          <strong className="text-ink">Text stays text.</strong> Pages are copied, not re-rendered,
          so anything selectable before is selectable after.
        </li>
        <li>
          <strong className="text-ink">Password-protected files need unlocking first.</strong> Run
          them through{" "}
          <Link href="/unlock-pdf" className="text-brand underline">
            Unlock PDF
          </Link>{" "}
          with the password you know, then merge.
        </li>
        <li>
          <strong className="text-ink">Numbering doesn&apos;t fix itself.</strong> If the merged
          bundle needs consecutive numbers, run it through{" "}
          <Link href="/add-page-numbers" className="text-brand underline">
            Add page numbers
          </Link>{" "}
          afterwards.
        </li>
        <li>
          <strong className="text-ink">Big scans get bigger.</strong> Merging doesn&apos;t compress.
          If the result has to get under an email limit,{" "}
          <Link href="/compress-pdf" className="text-brand underline">
            Compress PDF
          </Link>{" "}
          is the next stop.
        </li>
      </ul>

      <h2>How to prove nothing was uploaded</h2>
      <p>
        Every PDF site says your files are safe. Two checks separate the ones that mean &ldquo;we
        delete them later&rdquo; from the ones that never receive them:
      </p>
      <Steps
        items={[
          "Open your browser's developer tools and switch to the Network tab before you drop the files. Run the merge. On a local tool you will see no request carrying your files; on PDFAirlock, once the app is cached, you will see no requests at all.",
          "Load the page, turn off your wifi, then merge. A local tool finishes normally. An upload tool stops at the first step, because there is nowhere to send the file.",
        ]}
      />
      <p>
        On PDFAirlock there is a third layer you can read rather than test: the page ships with a
        Content-Security-Policy whose connect-src is &apos;self&apos;, which makes the browser
        itself refuse any request to another host. The{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy page
        </Link>{" "}
        explains the whole model.
      </p>

      <h2>The built-in options</h2>
      <p>
        <strong className="text-ink">macOS:</strong> Preview merges locally. Open the first PDF,
        show the thumbnail sidebar, then drag the second PDF&apos;s pages into it and save. It
        works; it is just fiddly for more than two files and offers no reordering beyond dragging
        thumbnails.
      </p>
      <p>
        <strong className="text-ink">Windows:</strong> there is no built-in merge. Print to PDF
        makes one PDF from one document; it cannot combine several. That gap is why so many Windows
        users end up on upload sites, and why a browser tool that never uploads is the easiest fix.
      </p>
      <p>
        <strong className="text-ink">Command line:</strong> qpdf and pdftk merge fine and are
        entirely local. If you already have one installed, use it. If you don&apos;t, the browser
        tool gets you the same guarantee without installing anything.
      </p>
    </ArticleLayout>
  );
}
