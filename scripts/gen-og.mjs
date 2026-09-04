import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, Path2D } from "@napi-rs/canvas";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, "src/lib/site.ts"), "utf8");
const site = {
  name: src.match(/SITE_NAME = "([^"]+)"/)?.[1] ?? "PDFAirlock",
  tagline: src.match(/SITE_TAGLINE = "([^"]+)"/)?.[1] ?? "",
};

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "#0c1222";
ctx.fillRect(0, 0, W, H);

ctx.save();
ctx.translate(90, 150);
const s = 110 / 32;
ctx.scale(s, s);
const rect = new Path2D();
rect.roundRect(2, 2, 28, 28, 7);
ctx.fillStyle = "#047857";
ctx.fill(rect);
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 2;
ctx.lineJoin = "round";
ctx.lineCap = "round";
ctx.stroke(new Path2D("M16 7l7 3v4.5c0 4.7-2.9 8.4-7 10-4.1-1.6-7-5.3-7-10V10l7-3z"));
ctx.stroke(new Path2D("M12.5 16l2.5 2.5 4.5-4.5"));
ctx.restore();

ctx.textBaseline = "top";
ctx.fillStyle = "#ffffff";
ctx.font = "bold 84px sans-serif";
ctx.fillText(site.name, 230, 158);

ctx.fillStyle = "#cbd5e1";
ctx.font = "42px sans-serif";
ctx.fillText(site.tagline, 92, 330);

ctx.fillStyle = "#34d399";
ctx.font = "600 34px sans-serif";
ctx.fillText("Free  ·  No uploads, ever  ·  Verify it yourself", 92, 470);

writeFileSync(join(root, "public/og.png"), canvas.encodeSync("png"));
console.log("[gen-og] public/og.png");
