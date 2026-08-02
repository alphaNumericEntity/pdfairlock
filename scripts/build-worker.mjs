import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

buildSync({
  entryPoints: [join(root, "src/lib/worker/ops.worker.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: join(root, "public/ops.worker.js"),
  logLevel: "info",
});
