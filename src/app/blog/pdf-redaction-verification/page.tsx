import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("pdf-redaction-verification");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

export default function Page() {
  return (
    <ArticleLayout article={article}>
      <p>
        A PDF page is not a picture — it&apos;s a little program: a stream of drawing operators,
        where text is glyph instructions, not pixels. Which is why the most common redaction
        technique in the world is broken: drawing a black rectangle over a name adds a <em>new</em>{" "}
        instruction on top while the text instructions stay in the file, one select-all-copy-paste
        from daylight. Courts, government agencies and companies have leaked names, prices and whole
        paragraphs exactly this way, repeatedly, for twenty years.
      </p>
      <p>
        When I built the redaction tool for PDFAirlock, the design rule was one sentence:{" "}
        <strong>redaction is destruction, not concealment.</strong> And because the target users are
        the people for whom a leak is catastrophic — lawyers, HR, healthcare — a second rule
        followed: <strong>the tool must prove it worked.</strong>
      </p>
      <h2>Destruction: rebuild the page without the secret</h2>
      <p>
        The shipped approach rasterizes: each redacted page is rendered to pixels, the black boxes
        are burned into those pixels, and a new page is assembled from the image at the original
        dimensions. An image-only page contains no text operators at all — there is nothing to
        select, search, or extract. The overlay failure mode isn&apos;t avoided; it&apos;s
        structurally impossible.
      </p>
      <p>
        The refinement that makes it practical is <em>mixed assembly</em>: only the pages you
        actually redacted are rebuilt as images; untouched pages are copied through verbatim and
        keep their selectable text (and their link annotations — while a redacted page deliberately
        carries zero annotations from the original, since a leftover link is itself a leak channel).
        A &ldquo;flatten everything&rdquo; option exists for maximum assurance. Metadata — title,
        author, XMP — is stripped either way, because Word-to-PDF metadata is where names hide.
      </p>
      <h2>Proof: treat your own output as untrusted</h2>
      <p>
        After producing the output, the tool re-opens it — as if it were a stranger&apos;s file —
        and audits it. Redacted pages must yield zero extractable text. Every searched term is then
        hunted across the extracted text of <em>all</em> pages: if &ldquo;Jane Doe&rdquo; survives
        on page 3 because you removed that box, the report doesn&apos;t show a vague red X — it says{" "}
        <em>page 3</em>, go add a box. A raw byte-scan runs as a tripwire behind the text checks,
        and the report says which check is the strong guarantee and which is heuristic, because a
        verifier that overstates its certainty is just the black rectangle again, one level up.
      </p>
      <h2>Testing a thing whose failure mode is silence</h2>
      <p>
        The scary property of redaction bugs is that they look like success. So the test suite is
        built around planted secrets and <em>controls</em>. A fixture document carries a known
        token; the pipeline runs; the assertions demand the token is gone from extracted text and
        raw bytes while innocent text on other pages survives. Alongside it sit two controls: a
        positive one proving the detectors <em>do</em> find the planted token before redaction, and
        a negative one proving that a plain resave — no redaction — does <em>not</em> remove it.
        Without the controls, a broken detector and a working redactor are indistinguishable from a
        working detector and a broken redactor.
      </p>
      <p>
        The end-to-end version goes further: a real browser drives the actual UI, searches for the
        secret, redacts, downloads — and then the test measures the pixels of the region where the
        secret used to sit and asserts they are black. Coordinate math from text search to burned
        box, proven with a luminance check.
      </p>
      <h2>What we still tell users</h2>
      <p>
        Review the output before distributing it. Not as legal boilerplate — as philosophy: the
        entire product exists so nobody has to take a tool&apos;s word for anything, and that
        includes ours. The verification report makes the review fast; it doesn&apos;t replace it.
      </p>
      <p>
        Try it — it runs in your browser and the file never leaves your machine:{" "}
        <Link href="/redact-pdf" className="text-brand underline">
          the redaction tool
        </Link>
        , and the deeper write-up in{" "}
        <Link href="/compare" className="text-brand underline">
          how we compare to the usual tools
        </Link>
        .
      </p>
    </ArticleLayout>
  );
}
