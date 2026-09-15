import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, Steps } from "@/components/article-layout";
import { mustGetArticle } from "@/lib/articles";

const article = mustGetArticle("sign-pdf-without-uploading");
export const metadata: Metadata = {
  title: article.metaTitle,
  description: article.metaDescription,
  alternates: { canonical: `/blog/${article.slug}` },
};

const FAQ = [
  {
    q: "Can I sign a PDF without uploading it?",
    a: "Yes. On PDFAirlock you draw the signature, place it on the page and download the signed copy, all inside your browser. There is no account and the tool works with your wifi off.",
  },
  {
    q: "Is a drawn signature legally valid?",
    a: "For most everyday agreements a drawn signature has the same standing as printing, signing and scanning, and is what the other party expects. Some regulated processes require a certificate-backed digital signature or an audit trail; check what your counterparty asks for.",
  },
  {
    q: "What is the difference between a drawn signature and a digital signature?",
    a: "A drawn signature is an image placed on the page. A digital signature is a cryptographic certificate embedded in the file that a viewer can validate. PDFAirlock adds the first kind.",
  },
  {
    q: "Can I sign on my phone?",
    a: "Yes. Draw with your finger, place the signature, download. Nothing is uploaded from the phone either.",
  },
  {
    q: "Can I sign more than one page?",
    a: "Place the signature, apply it, then open the signed file again and place another. Each pass adds one signature.",
  },
];

export default function Page() {
  return (
    <ArticleLayout article={article} faq={FAQ}>
      <p>
        Someone sends you a PDF and asks for a signature. The obvious route is an e-signature site:
        create an account, upload the contract, sign, wait for the email. For a two-party agreement
        that just needs your name on the last page, that is a lot of ceremony, and it leaves a copy
        of the contract on a server you don&apos;t control. There is a shorter way.
      </p>

      <h2>Signing in the browser, without an upload</h2>
      <Steps
        items={[
          "Open Sign PDF and choose the document.",
          "Draw your signature in the box with a mouse, trackpad or finger. Clear and redo it until it looks like yours.",
          "Go to the page that needs signing and place the signature where it belongs. Adjust the size so it sits on the line.",
          "Click Sign and download the signed copy. The original is untouched.",
        ]}
      />
      <p>
        <Link href="/sign-pdf" className="text-brand underline">
          Open Sign PDF →
        </Link>
      </p>

      <h2>What you are actually adding</h2>
      <p>
        The tool places an image of your drawn signature into the page, which is the same thing you
        would get by printing the page, signing it with a pen and scanning it back. For most
        agreements that is precisely what is being asked for: leases, NDAs, quotes, consent forms,
        school and medical paperwork. It is not a cryptographic digital signature. Nothing in the
        file lets a viewer verify who signed it or whether the document changed afterwards.
      </p>
      <p>
        When does that distinction matter? When the process is regulated or contested: some
        government filings, some financial and healthcare workflows, and any situation where the
        other side needs an audit trail with timestamps and identity checks. Those are the cases for
        DocuSign-style services or certificate-based signing, and they are worth the account and the
        upload. Everything else isn&apos;t.
      </p>

      <h2>Before you send it back</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          If you also need to date the document or write a name next to the signature, that is text
          the file doesn&apos;t have. Draw it as part of the signature, or fill the form in a
          desktop viewer first and sign afterwards.
        </li>
        <li>
          Contracts with several signature lines: sign, download, open the signed file again and
          place the next one.
        </li>
        <li>
          If the document needs anything removed before it goes back, do that first with{" "}
          <Link href="/redact-pdf" className="text-brand underline">
            Redact PDF
          </Link>{" "}
          or{" "}
          <Link href="/delete-pdf-pages" className="text-brand underline">
            Delete pages
          </Link>
          ; both stay in the browser too.
        </li>
      </ul>

      <h2>How to prove nothing was uploaded</h2>
      <p>
        A signed contract is exactly the file you don&apos;t want sitting on a stranger&apos;s
        server. Two quick checks show whether a signing tool is really local: open the Network tab
        in your browser&apos;s developer tools and watch for any request carrying your file while
        you sign, and then load the page, turn off your wifi, and sign again. PDFAirlock passes
        both, and its Content-Security-Policy forbids the browser from contacting any other host in
        the first place. The{" "}
        <Link href="/privacy" className="text-brand underline">
          privacy page
        </Link>{" "}
        walks through the whole model.
      </p>
    </ArticleLayout>
  );
}
