import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, CodeBlock, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";
import { SOURCE_URL } from "@/lib/site";

const article = mustGetArticle("redacted-doesnt-mean-deleted");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const DISCUSSION_URL = "https://dev.to/alphanumericentity/redacted-doesnt-mean-deleted-3bk6";

const ROWS = [
  { how: "Black box drawn over it", text: true, search: true, qpdf: true },
  { how: "Deleted, but left in the metadata", text: false, search: true, qpdf: true },
  { how: "Edited and saved by appending", text: false, search: true, qpdf: false },
  { how: "Same, with normal compression", text: false, search: false, qpdf: false },
];

function mark(caught: boolean): string {
  return caught ? "✅ caught" : "❌ missed";
}

export default function Page() {
  return (
    <ArticleLayout article={article}>
      <p>Here&apos;s a PDF. Open it, and one line reads:</p>
      <CodeBlock>{"Name and SSN: [REDACTED]"}</CodeBlock>
      <p>
        Copy the text out of it, and you get <code>[REDACTED]</code>. Search the whole file for the
        SSN, and you find nothing. Open it in <code>qpdf</code>, a PDF debugging tool that unpacks
        the document and prints everything in it, and you still find nothing.
      </p>
      <p>Now run one command:</p>
      <CodeBlock>{"head -c 823 released.pdf > recovered.pdf"}</CodeBlock>
      <p>
        That keeps the first 823 bytes of a 1,158-byte file and throws the rest away. Open{" "}
        <code>recovered.pdf</code>:
      </p>
      <CodeBlock>{"Name and SSN: Marigold-Vance-447-26-8891"}</CodeBlock>
      <p>
        It isn&apos;t a corrupted file or a trick. It&apos;s a perfectly valid PDF, and it&apos;s
        the document exactly as it was before the edit.
      </p>
      <p>
        (The SSN is made up. I built every file in this post, so nobody&apos;s real data is
        involved.)
      </p>
      <p>
        The part that stung: I ran this file through PDFAirlock&apos;s own redaction checker, with
        the SSN typed into its search box, and it said{" "}
        <strong>&ldquo;Nothing recoverable found.&rdquo;</strong> I've fixed that, and the fix
        turned out to be the most useful thing in this post.
      </p>

      <h2>PDFs can keep their own history</h2>
      <p>
        PDF has a feature most people never hear about. When an editor saves, it doesn&apos;t have
        to rewrite the file. It can add just the changed parts onto the end, plus a note saying
        &ldquo;these replace the old ones.&rdquo;
      </p>
      <p>
        If you&apos;re a developer, think git. Every save like that is a new commit on top. Your PDF
        viewer only ever checks out the latest commit, so you see <code>[REDACTED]</code>. But the
        old commit is still sitting in the history, and in a PDF the history is simply the front of
        the file. Cut the file where the first save ended, and you&apos;ve checked out the original.
      </p>
      <p>
        That&apos;s why every check missed it. Copying the text, searching, and the debugging tool
        all ask what the document says <em>now</em>, and they all answer correctly: it says{" "}
        <code>[REDACTED]</code>. The old version isn&apos;t part of the document anymore. It&apos;s
        still part of the file.
      </p>
      <p>
        The plain search failed for a more boring reason. PDF page content is usually compressed,
        with the same algorithm zip uses, so the SSN is in there, just not as readable text.
      </p>
      <p>
        Nothing warns you when an editor saves this way. The file looks, opens and prints like any
        other.
      </p>

      <h2>Four ways to &ldquo;remove&rdquo; an SSN</h2>
      <p>I built four PDFs that each claim the SSN is gone, and ran three checks on each:</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse rounded-2xl border border-zinc-200 bg-surface text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left">
              <th className="px-3 py-2 font-semibold">How the SSN was &ldquo;removed&rdquo;</th>
              <th className="px-3 py-2 font-semibold">Copy the text</th>
              <th className="px-3 py-2 font-semibold">Search the file</th>
              <th className="px-3 py-2 font-semibold">Inspect with qpdf</th>
              <th className="px-3 py-2 font-semibold">Still recoverable?</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.how} className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium text-ink">{r.how}</td>
                <td className="px-3 py-2">{mark(r.text)}</td>
                <td className="px-3 py-2">{mark(r.search)}</td>
                <td className="px-3 py-2">{mark(r.qpdf)}</td>
                <td className="px-3 py-2 font-semibold text-ink">yes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The first two are the classic mistakes, and{" "}
        <Link href="/blog/pdf-redaction-verification" className="text-brand underline">
          I&apos;ve written about them before
        </Link>
        . A black box is just a shape drawn on top of text that&apos;s still there. Metadata is a
        properties panel that apps fill in on their own and people rarely check.
      </p>
      <p>
        The last row is what this post is about. Every check misses it, and the secret is still one
        command away.
      </p>

      <h2>Catching it without knowing what to look for</h2>
      <p>
        Searching only works if you know what you&apos;re searching for. Often you don&apos;t,
        because you&apos;re checking a file somebody else redacted.
      </p>
      <p>The good news is that the file gives itself away. Every save ends with a short footer:</p>
      <CodeBlock>{"startxref\n608\n%%EOF"}</CodeBlock>
      <p>
        A PDF saved once has one footer. A PDF that was edited and saved by appending has one per
        save. So the check is:
      </p>
      <Steps
        items={[
          "Find every footer.",
          "Cut the file at each one except the last. Each cut is an older version.",
          "Pull the text out of each older version.",
          "Report any text that's in an older version but missing from the current one.",
        ]}
      />
      <p>No search term needed. On the file above, that turns up the full SSN line on its own.</p>

      <h2>The bug I almost shipped</h2>
      <p>
        My first version was simpler: more than one <code>%%EOF</code> means edit history, so warn.
      </p>
      <p>
        Then I tested it on a &ldquo;linearized&rdquo; PDF, the kind saved for fast loading on the
        web, which I made from the clean, saved-once file. It had two footers and no history at all.
        That detector would have flagged perfectly normal PDFs as edited.
      </p>
      <p>
        The difference is that in the linearized file, the extra footer points at position 0. A real
        save can never point there, because position 0 is where the file&apos;s <code>%PDF</code>{" "}
        header lives. So the checker ignores footers that point at 0. It also ignores the first
        footer of any file that says it&apos;s linearized, in case some tool writes a different
        number there.
      </p>
      <p>
        And it compares text rather than counting footers. So even if it misreads a footer, it can
        only report a leak when an older version really does hold text you can no longer see.
      </p>

      <h2>Try it on your own files</h2>
      <CodeBlock>{"grep -c %%EOF yourfile.pdf"}</CodeBlock>
      <p>
        <code>1</code> means the file was written in one go. More than 1 means it has edit history,
        or it's a fast-loading web PDF. To find out which, and to see exactly what any older version
        contains, drop it into the{" "}
        <Link href="/pdf-redaction-checker" className="text-brand underline">
          redaction checker
        </Link>
        . It runs in your browser, so the file never leaves your machine.
      </p>
      <p>
        The checker now does everything above. It finds older versions, pulls the text from each,
        lists anything the current pages don&apos;t show, and searches whatever you type in every
        version, not just the latest. If older versions exist but their text matches, it still tells
        you, because a removed photo or signature wouldn&apos;t show up when comparing text.
      </p>
      <p>
        The{" "}
        <Link href="/redact-pdf" className="text-brand underline">
          redaction tool
        </Link>{" "}
        never had this problem, because it doesn&apos;t edit your file. It builds a brand-new one,
        with the redacted pages rebuilt as images and the metadata stripped, so there&apos;s no
        history for anything to hide in. It&apos;s all open source (AGPL), and the detector is{" "}
        <a href={SOURCE_URL} className="text-brand underline">
          in the repo
        </a>{" "}
        if you want to borrow it.
      </p>

      <h2>What I haven&apos;t tested</h2>
      <p>
        I built these files myself, so this shows <em>how</em> the leak works, not{" "}
        <em>how often</em> it happens. I haven't scanned anyone's real documents, and I'd be wary of
        anyone quoting a percentage without saying where it came from.
      </p>
      <p>Other leaks I know about but didn&apos;t build here:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Scanned PDFs with a hidden, searchable text layer behind the image</li>
        <li>Thumbnail previews saved from before the redaction</li>
        <li>Accessibility tags that keep a second copy of the text for screen readers</li>
        <li>Embedded fonts that still list which letters were used</li>
        <li>
          Leftover compressed pieces of a file that no version points to. Every check above misses
          those, my checker included.
        </li>
      </ul>

      <h2>So here&apos;s my question</h2>
      <p>Text, I can now catch. Pictures, I can&apos;t.</p>
      <p>
        If someone deletes a face or a signature and the editor saves by appending, the checker can
        tell you an older version exists. It can&apos;t tell you that version holds a face someone
        meant to destroy. Comparing the pixels of each version will show that <em>something</em>{" "}
        changed, but to a pixel diff, a moved logo and a deleted face look exactly the same.
      </p>
      <p>
        How would you tell, automatically, that an image in an older version was meant to be
        removed? I don&apos;t have an answer I trust. If you do, I&apos;d like to hear it in{" "}
        <a href={DISCUSSION_URL} className="text-brand underline">
          the discussion on DEV
        </a>
        .
      </p>
    </ArticleLayout>
  );
}
