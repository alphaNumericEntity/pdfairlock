import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

for (const entry of ["ops.worker.ts", "qpdf.worker.ts"]) {
  buildSync({
    entryPoints: [join(root, "src/lib/worker", entry)],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    target: "es2022",
    external: ["fs", "path", "crypto", "module", "url", "child_process", "worker_threads"],
    outfile: join(root, "public", entry.replace(".ts", ".js")),
    logLevel: "info",
  });
}
