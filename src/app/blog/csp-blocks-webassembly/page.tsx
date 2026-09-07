import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, CodeBlock } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("csp-blocks-webassembly");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

export default function Page() {
  return (
    <ArticleLayout article={article}>
      <p>
        The first production deploy of PDFAirlock had a clean bill of health: 104 automated tests
        green, the full end-to-end suite passing in three browser engines against a local build of
        the exact bytes being shipped. Then I pointed the same e2e suite at the live URL, and the
        password tools were dead. Click &ldquo;Add password&rdquo;, nothing. No crash screen, no
        console explosion in the happy path — just an operation that never finished.
      </p>
      <p>
        Nothing about the build differed. The same worker file, the same WASM binary, the same HTML.
        The only thing production had that my local test server didn&apos;t was <em>headers</em>.
      </p>
      <h2>The culprit is the security header we were proud of</h2>
      <p>
        PDFAirlock&apos;s whole pitch is that files can&apos;t leave your browser, and part of the
        enforcement is a strict Content-Security-Policy. The relevant slice looked like this:
      </p>
      <CodeBlock>{`Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; ...`}</CodeBlock>
      <p>
        Here&apos;s the part I didn&apos;t know: in Chromium, once you declare a{" "}
        <code>script-src</code>, compiling WebAssembly requires an explicit capability. Without it,{" "}
        <code>WebAssembly.instantiate</code> throws a <code>CompileError</code> — our qpdf engine
        (real qpdf, compiled to WASM, doing AES-256 encryption) could be downloaded but never
        compiled. The keyword that grants it:
      </p>
      <CodeBlock>{`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';`}</CodeBlock>
      <p>
        <code>&apos;wasm-unsafe-eval&apos;</code> is the WASM-only sibling of{" "}
        <code>&apos;unsafe-eval&apos;</code>: it permits WebAssembly compilation without also
        re-enabling JavaScript <code>eval()</code>. The name is scarier than the reality — for a
        site whose WASM is self-hosted and whose CSP forbids loading scripts from anywhere else,
        it&apos;s the correct, minimal grant.
      </p>
      <h2>Why every local test missed it</h2>
      <p>
        The local e2e suite runs against a plain static file server — which sends no CSP header at
        all. No header, no restriction, WASM compiles fine, 104 tests pass. The header only exists
        in production because the hosting platform injects it from configuration. The bug
        wasn&apos;t in the code being tested; it was in the <em>delta between environments</em>, and
        that delta is invisible by construction to any purely local test.
      </p>
      <p>
        The same live run caught a second environment-only bug the same afternoon: the deployment
        platform skipped our npm lifecycle scripts and rebuilt from intermediate artifacts, silently
        dropping a file our offline mode depended on. Two ship-blockers, zero of them catchable
        locally.
      </p>
      <h2>What changed afterwards</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          The e2e suite accepts a base URL, and every deploy-affecting change ends with a run
          against production:{" "}
          <code>PLAYWRIGHT_BASE_URL=https://pdfairlock.com npx playwright test</code>. It&apos;s the
          same specs — real uploads, real downloads, real assertions on the output files — just
          aimed at the thing users actually touch.
        </li>
        <li>
          The CSP is treated as code: it lives in the repo, and any edit to it is reviewed like a
          security change, because it is one — in both directions. Too loose leaks; too strict, as
          we learned, breaks.
        </li>
        <li>
          One spec now exists purely to assert the product&apos;s core claim under the real CSP:
          process a file while recording every network request, and require that zero non-origin
          requests occurred.
        </li>
      </ul>
      <p>
        The general lesson isn&apos;t about WASM. It&apos;s that headers, build pipelines, and CDN
        behavior are part of your program, and the only environment that runs your whole program is
        production. Test there — politely, automatically, after every deploy.
      </p>
      <p>
        More on how the enforcement fits together:{" "}
        <Link href="/privacy" className="text-brand underline">
          the PDFAirlock privacy model
        </Link>
        .
      </p>
    </ArticleLayout>
  );
}
