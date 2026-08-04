import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, Path2D } from "@napi-rs/canvas";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 32;
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

  return canvas.encodeSync("png");
}

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  writeFileSync(join(root, "public", name), drawIcon(size));
  console.log(`[gen-icons] ${name}`);
}
