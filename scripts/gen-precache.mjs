import { readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "out");

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(relative(out, full));
  }
  return acc;
}

const urls = new Set();
for (const file of walk(out)) {
  const posix = file.split("\\").join("/");
  if (posix.startsWith("pdfjs/")) continue;
  if (posix.endsWith(".map")) continue;
  if (posix === "index.html") {
    urls.add("/");
  } else if (posix.endsWith(".html")) {
    urls.add(`/${posix.slice(0, -".html".length)}`);
  } else if (
    posix.startsWith("_next/static/") ||
    posix.endsWith(".txt") ||
    [
      "ops.worker.js",
      "qpdf.worker.js",
      "qpdf.wasm",
      "pdf.worker.min.mjs",
      "icon.svg",
      "icon-192.png",
      "icon-512.png",
      "apple-touch-icon.png",
      "manifest.webmanifest",
    ].includes(posix)
  ) {
    urls.add(`/${posix}`);
  }
}

const list = [...urls].sort();
writeFileSync(join(out, "precache-manifest.js"), `self.__PRECACHE = ${JSON.stringify(list)};\n`);
console.log(`[gen-precache] ${list.length} urls into out/precache-manifest.js`);
