import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = join(root, "node_modules/pdfjs-dist");

if (!existsSync(pkg)) {
  console.warn("[copy-pdf-worker] pdfjs-dist not installed yet, skipping");
  process.exit(0);
}

const copies = [
  ["build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs"],
  ["cmaps", "public/pdfjs/cmaps"],
  ["standard_fonts", "public/pdfjs/standard_fonts"],
  ["wasm", "public/pdfjs/wasm"],
  ["iccs", "public/pdfjs/iccs"],
];

for (const [from, to] of copies) {
  const src = join(pkg, from);
  if (!existsSync(src)) continue;
  const dest = join(root, to);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const qpdfWasm = join(root, "node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm");
if (existsSync(qpdfWasm)) cpSync(qpdfWasm, join(root, "public/qpdf.wasm"));
console.log("[copy-pdf-worker] pdf.js assets + qpdf.wasm copied into public/");
