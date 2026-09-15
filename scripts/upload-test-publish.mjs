import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const IN = join(import.meta.dirname, "../demo-out/upload-test/results.json");
const OUT = join(import.meta.dirname, "../src/lib/upload-test-results.ts");

function plainNote(r) {
  if (/ERR_HTTP2_PROTOCOL_ERROR|ERR_CONNECTION/.test(r.note ?? ""))
    return "the site refused the automated browser's connection";
  if (/no file input/.test(r.note ?? "")) return "no file input could be found on the page";
  if (r.note) return r.note;
  if (r.finalUrl && new URL(r.finalUrl).pathname !== new URL(r.url).pathname)
    return `the page redirected to ${new URL(r.finalUrl).pathname}`;
  return "";
}

const rows = JSON.parse(readFileSync(IN, "utf8"))
  .map((r) => ({
    site: r.site,
    url: r.url,
    verdict: r.verdict,
    uploadedKb: Math.round(r.uploadedBytes / 1024),
    uploadHosts: r.uploadHosts,
    completedOnline: r.outcome === "download-event" || r.outcome === "download-control",
    worksOffline:
      r.verdict === "not-testable" || r.verdict === "inconclusive"
        ? null
        : r.offlineOutcome === "download-event" || r.offlineOutcome === "download-control",
    note: plainNote(r),
    testedAt: r.testedAt.slice(0, 10),
  }))
  .sort((a, b) => a.site.localeCompare(b.site));

const fixtureKb = Math.round(JSON.parse(readFileSync(IN, "utf8"))[0].fixtureBytes / 1024);
const dates = [...new Set(rows.map((r) => r.testedAt))].sort();

const source = `export type UploadTestRow = {
  site: string;
  url: string;
  verdict: "uploads" | "no-upload" | "inconclusive" | "not-testable";
  uploadedKb: number;
  uploadHosts: string[];
  completedOnline: boolean;
  worksOffline: boolean | null;
  note: string;
  testedAt: string;
};

export const UPLOAD_TEST_DATES = ${JSON.stringify(dates)};
export const UPLOAD_TEST_FIXTURE_KB = ${fixtureKb};
export const UPLOAD_TEST_ROWS: UploadTestRow[] = ${JSON.stringify(rows, null, 2)};
`;
writeFileSync(OUT, source);
console.log(`wrote ${rows.length} rows to ${OUT}`);
