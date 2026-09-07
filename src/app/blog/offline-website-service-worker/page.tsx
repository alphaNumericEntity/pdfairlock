import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, CodeBlock } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("offline-website-service-worker");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

export default function Page() {
  return (
    <ArticleLayout article={article}>
      <p>
        PDFAirlock&apos;s landing page makes a checkable promise: load the site once, switch on
        airplane mode, and everything still works — because your files are processed by your own
        browser, there&apos;s no server to need. A service worker makes that true. What I want to
        write down is how many subtly wrong versions of &ldquo;true&rdquo; I shipped on the way,
        because each one demoed perfectly.
      </p>
      <h2>Wrong version #1: cache-first, cache-forever</h2>
      <p>
        The first service worker did the classic runtime recipe: intercept fetches, serve from
        cache, fall back to network, store what you fetch. Offline demo: flawless. The bug surfaced
        when I changed the pricing page and realized returning visitors would <em>never</em> see it
        — cache-first with no revalidation means your site is frozen at whatever version each
        visitor saw first. The fix was stale-while-revalidate: serve the cache instantly (offline
        stays instant), refresh in the background, so updates land on the next visit.
      </p>
      <h2>Wrong version #2: offline works… if you rehearse</h2>
      <p>
        The embarrassing one, found only because I wrote a test for the exact wording of the
        promise: <em>first</em> visit → airplane mode → reload → merge a PDF. It failed. A
        runtime-caching worker only caches what got requested, and the page&apos;s own HTML and
        chunks were fetched <em>before</em> the worker took control; the PDF-engine worker script
        wasn&apos;t fetched at all until the first operation ran. So the demo worked beautifully for
        anyone who had already used a tool while online — which described me, every time I demoed it
        — and broke for the actual promise made to a first-time visitor.
      </p>
      <p>
        The honest fix is precaching: at install time, the service worker fetches the complete asset
        list up front. But a modern build has content-hashed filenames you can&apos;t know in
        advance, so the list must be generated <em>after</em> the build — a script walks the output
        directory and emits a manifest the worker loads:
      </p>
      <CodeBlock>{`// sw.js
importScripts("/precache-manifest.js");   // self.__PRECACHE = [242 urls]
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(self.__PRECACHE)))
);`}</CodeBlock>
      <p>
        That&apos;s ~5MB on first visit for this site — every page, chunk, worker and WASM binary.
        For most products that trade-off would be wrong; for one whose core promise is offline,
        it&apos;s the product.
      </p>
      <h2>Wrong version #3: correct code, wrong deployment</h2>
      <p>
        The manifest generator ran as an npm <code>postbuild</code> script writing into the output
        folder. Locally: perfect. In production: the manifest 404&apos;d, and offline quietly
        degraded back to version #2. Two platform behaviors conspired — the host invoked the
        framework&apos;s build directly (skipping npm lifecycle scripts), and its framework-aware
        pipeline reconstructed the deployment from intermediate artifacts, ignoring files added to
        the output folder afterwards. The durable fix was to opt out of the cleverness entirely:
        build to a static folder, tell the platform to serve that folder verbatim. Production now
        behaves byte-for-byte like the local test server, which retired a whole category of
        &ldquo;works on my machine&rdquo;.
      </p>
      <h2>The test is the spec</h2>
      <p>
        The reason any of this got caught is that the promise exists as an executable spec: a real
        browser visits once, waits for the worker to take control, goes offline, reloads, and merges
        two PDFs — and the suite runs against the production URL after deploys, not just against
        localhost. One practical note if you copy this: the worker&apos;s install (5MB of precache)
        takes real time over a real network, so the spec waits for{" "}
        <code>navigator.serviceWorker.controller</code> with a generous timeout before pulling the
        plug.
      </p>
      <p>
        The result is a claim I can invite anyone to falsify:{" "}
        <Link href="/merge-pdf" className="text-brand underline">
          open a tool
        </Link>
        , flip on airplane mode, and see. That invitation — not the service worker — is the actual
        feature.
      </p>
    </ArticleLayout>
  );
}
