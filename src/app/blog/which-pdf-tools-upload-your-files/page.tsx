import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, CodeBlock, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";
import {
  UPLOAD_TEST_DATES,
  UPLOAD_TEST_FIXTURE_KB,
  UPLOAD_TEST_ROWS,
  type UploadTestRow,
} from "@/lib/upload-test-results";

const article = mustGetArticle("which-pdf-tools-upload-your-files");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const CLAIMS: Record<string, { says: string; claimsLocal: boolean }> = {
  "PDFAirlock (control)": {
    says: "Files never leave your device; works with wifi off.",
    claimsLocal: true,
  },
  iLovePDF: {
    says: "Files handled safely and automatically deleted after 2 hours.",
    claimsLocal: false,
  },
  Smallpdf: {
    says: "Encrypted with TLS, deleted from our servers after one hour.",
    claimsLocal: false,
  },
  "PDF24 Tools": {
    says: "Merged in the cloud on our servers; deleted after one hour.",
    claimsLocal: false,
  },
  Sejda: { says: "Files stay private, automatically deleted after 2 hours.", claimsLocal: false },
  "Adobe Acrobat online": {
    says: "Handled by Adobe servers and deleted unless you sign in to save.",
    claimsLocal: false,
  },
  "PDFgear online": {
    says: "Processed locally in your browser; no file data is uploaded.",
    claimsLocal: true,
  },
  "PDF Candy": { says: "All uploads automatically deleted within 2 hours.", claimsLocal: false },
  PDF2Go: {
    says: "Files kept safe on our servers, not shared with third parties.",
    claimsLocal: false,
  },
  CombinePDF: { says: "Files automatically deleted after one hour.", claimsLocal: false },
  Xodo: {
    says: "Encrypted at rest and in transit; no statement about where merging happens.",
    claimsLocal: false,
  },
  CleanPDF: {
    says: "Documents never leave your device; no upload to any server.",
    claimsLocal: true,
  },
  ihatepdf: {
    says: "Files never leave your device; works with the connection cut.",
    claimsLocal: true,
  },
  LocalPDF: { says: "Merged locally; nothing is sent to a server.", claimsLocal: true },
  BentoPDF: { says: "Files never leave your device.", claimsLocal: true },
};

const FAQ = [
  {
    q: "Is it wrong for a PDF site to upload my file?",
    a: "Not in itself: that is how most of them work, and many say so. It means the copy of your document on their server is protected by their policy, their staff and their security, and their promise to delete it. Whether that is acceptable depends on what is in the document.",
  },
  {
    q: "How can a merge happen without an upload?",
    a: "A PDF is a file format a browser can parse. With WebAssembly and a library such as pdf-lib or qpdf, the combining runs on your own machine inside the page; the site only serves the code. The proof is that the job still completes with the network cut.",
  },
  {
    q: "Who ran this test, and are you neutral?",
    a: "We build PDFAirlock, one of the tools in the table, so no. That is why the method is published in full: the same files went to every site, the numbers are byte counts from the browser's own network layer, and anyone can repeat the check in a minute with developer tools.",
  },
  {
    q: "Can I check a tool myself?",
    a: "Yes. Open the site, open your browser's developer tools on the Network tab, then add a file and watch for a request whose size matches it. Then load the page, turn off your wifi, and try the job again. The section above walks through it.",
  },
  {
    q: "Will you re-run it?",
    a: "Sites change. The dates in the table are when each row was measured; the harness is a short Playwright script and we intend to re-run it when a tool changes how it works.",
  },
];

function Verdict({ row }: { row: UploadTestRow }) {
  if (row.verdict === "not-testable")
    return <span className="text-ink-soft">Not testable by our harness</span>;
  if (row.verdict === "inconclusive")
    return (
      <span className="text-ink-soft">
        Inconclusive: no upload seen, but the merge never completed under automation
      </span>
    );
  if (row.verdict === "uploads")
    return <span className="font-medium text-red-800">Uploads the file</span>;
  return <span className="font-medium text-brand-dark">Never uploads</span>;
}

function Offline({ row }: { row: UploadTestRow }) {
  if (row.worksOffline === null) return <span className="text-ink-soft">—</span>;
  return row.worksOffline ? <span className="text-brand-dark">Yes</span> : <span>No</span>;
}

function Claim({ row }: { row: UploadTestRow }) {
  const claim = CLAIMS[row.site];
  if (!claim || row.verdict === "not-testable" || row.verdict === "inconclusive") return null;
  const held = claim.claimsLocal ? row.verdict === "no-upload" : true;
  return held ? null : (
    <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-800">
      contradicts its own claim
    </span>
  );
}

export default function Page() {
  const rows = UPLOAD_TEST_ROWS;
  const uploads = rows.filter((r) => r.verdict === "uploads");
  const local = rows.filter((r) => r.verdict === "no-upload");
  const untestable = rows.filter(
    (r) => r.verdict === "not-testable" || r.verdict === "inconclusive",
  );
  const contradicted =
    local.length + uploads.length > 0 ? uploads.filter((r) => CLAIMS[r.site]?.claimsLocal) : [];
  const testedCount = rows.length - 1;
  const dateText =
    UPLOAD_TEST_DATES.length === 1
      ? UPLOAD_TEST_DATES[0]
      : `${UPLOAD_TEST_DATES[0]} to ${UPLOAD_TEST_DATES[UPLOAD_TEST_DATES.length - 1]}`;

  return (
    <ArticleLayout article={article} faq={FAQ}>
      <p>
        Every online PDF tool tells you your files are safe. Read closely and the claims split into
        two kinds. One kind is a promise: we encrypt the upload, we delete it after an hour. The
        other kind is a physical statement: the file never leaves your computer, so there is nothing
        to promise. Both are easy to write on a landing page. Only one is easy to check, and we
        checked it.
      </p>
      <p>
        We took the same two synthetic PDFs, merged them on {testedCount} popular online tools plus
        our own as a control, and logged every request the browser sent, with its size. Then we did
        the whole thing again with the network cut. The numbers are below, per site, with the date
        each row was measured.
      </p>

      <h2>The results</h2>
      <p>
        {uploads.length} of the {testedCount} tools sent our files to their servers.{" "}
        {local.filter((r) => !r.site.startsWith("PDFAirlock")).length} besides our own completed the
        merge without sending them anywhere, and{" "}
        {local.filter((r) => !r.site.startsWith("PDFAirlock") && r.worksOffline).length} of those
        still worked with the wifi off.
        {untestable.length > 0
          ? ` ${untestable.length} could not be completed by our automation and are marked as such rather than guessed at; the notes say why.`
          : ""}
        {contradicted.length > 0
          ? ` ${contradicted.length} of the uploading tools state on the same page that files are processed locally.`
          : " Every tool that claims local processing was found to do it."}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse rounded-2xl border border-zinc-200 bg-surface text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left">
              <th className="px-3 py-2 font-semibold">Tool</th>
              <th className="px-3 py-2 font-semibold">What its page says</th>
              <th className="px-3 py-2 font-semibold">Sent during the merge</th>
              <th className="px-3 py-2 font-semibold">Works with wifi off</th>
              <th className="px-3 py-2 font-semibold">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.site} className="border-t border-zinc-100 align-top">
                <td className="px-3 py-2 font-medium">
                  <a href={r.url} rel="nofollow noopener" className="underline decoration-zinc-300">
                    {r.site}
                  </a>
                  <div className="text-xs text-ink-soft">{r.testedAt}</div>
                </td>
                <td className="px-3 py-2 text-ink-soft">
                  {CLAIMS[r.site]?.says ?? "—"}
                  {r.note && <div className="mt-1 text-xs">Note: {r.note}.</div>}
                </td>
                <td className="px-3 py-2">
                  {r.verdict === "not-testable"
                    ? "—"
                    : r.uploadedKb === 0
                      ? "0 KB"
                      : `${r.uploadedKb} KB to ${r.uploadHosts.join(", ")}`}
                </td>
                <td className="px-3 py-2">
                  <Offline row={r} />
                </td>
                <td className="px-3 py-2">
                  <Verdict row={r} />
                  <Claim row={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        The two test files total {UPLOAD_TEST_FIXTURE_KB} KB. A tool that shows roughly that many
        kilobytes sent the whole documents; a few extra kilobytes is multipart overhead. Sites that
        could not be driven by the harness are listed as not testable, not as a pass.
      </p>

      <h2>What the numbers mean</h2>
      <p>
        When a row says a file was sent, the entire document left the machine and arrived at the
        host named. From that moment its safety rests on the promise next to it: TLS on the way in,
        deletion after an hour or two, staff who don&apos;t look. Those promises may well be kept;
        the point is that you cannot verify any of them, and the deletion clock starts after your
        contract, statement or medical letter is already on someone else&apos;s disk.
      </p>
      <p>
        When a row says 0 KB and the wifi-off column says yes, nothing was promised, because nothing
        was sent. The merging ran inside the browser tab, and cutting the network made no
        difference. That is a different category of safe, and it is the reason this site exists.
      </p>

      <h2>How we tested</h2>
      <Steps
        items={[
          `Two synthetic PDFs (${UPLOAD_TEST_FIXTURE_KB} KB together, a test pattern image and a line of text, no real data) were generated fresh for the run.`,
          "For each site, a fresh Chromium profile driven by Playwright opened the merge page, dismissed cookie banners, put both files into the file input and clicked the merge control. Every non-GET request the page made was recorded with its host and the size of its body, taken from the browser's own network layer.",
          "A tool counts as uploading when the bodies it sent add up to at least half of the test files. In practice the uploaders sent all of it.",
          "The offline pass loaded the page again, waited up to 30 seconds for any service worker to take control, cut the network, and repeated the job. A result counted only if a real download started or a download control appeared that wasn't there before.",
          `Everything was run on ${dateText}. Screenshots and the raw request logs were kept for every row.`,
        ]}
      />
      <p>The recording is the whole trick, and it is short:</p>
      <CodeBlock>{`page.on("requestfinished", async (req) => {
  if (req.method() === "GET") return;
  const headers = await req.allHeaders();
  log.push({
    host: new URL(req.url()).host,
    bytes: Number(headers["content-length"] ?? 0),
  });
});`}</CodeBlock>

      <h2>Do it yourself in a minute</h2>
      <Steps
        items={[
          "Open the tool's page and your browser's developer tools (F12, or Cmd-Option-I on a Mac). Choose the Network tab.",
          "Add a PDF and, if needed, click the tool's go button. Look for a request whose size is about the size of your file. Click it: the host it went to is right there.",
          "Now load the page fresh, turn off your wifi, and try again. A tool that never uploads finishes the job anyway; an upload tool stops at the first step.",
        ]}
      />

      <h2>Limitations</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          One tool per site, on one day. Sites change; the dates are in the table and the harness is
          easy to re-run.
        </li>
        <li>
          The automation is generic. Where it could not find a file input or a go button, the site
          is marked not testable, which says nothing about its privacy either way.
        </li>
        <li>
          We measured what left the browser, not what happened afterwards. Whether an uploading site
          keeps its deletion promise is exactly the thing this test cannot see, which is rather the
          point.
        </li>
        <li>
          We make{" "}
          <Link href="/merge-pdf" className="text-brand underline">
            one of the tools in the table
          </Link>
          . It was run under the same script as the others, and the method above is the argument,
          not our word.
        </li>
      </ul>
    </ArticleLayout>
  );
}
