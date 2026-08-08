import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { drawnImageMatrices } from "../tests/pdf-inspect";
import { makePdf } from "./helpers";

test("drawn signature lands where the user clicked, at the chosen size", async ({ page }) => {
  await page.goto("/sign-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([
      { name: "contract.pdf", mimeType: "application/pdf", buffer: await makePdf(1) },
    ]);

  const pad = page.locator("canvas").first();
  await expect(pad).toBeVisible();
  const padBox = await pad.boundingBox();
  if (!padBox) throw new Error("signature pad not visible");
  await page.mouse.move(padBox.x + padBox.width * 0.2, padBox.y + padBox.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(padBox.x + padBox.width * 0.5, padBox.y + padBox.height * 0.3, {
    steps: 8,
  });
  await page.mouse.move(padBox.x + padBox.width * 0.8, padBox.y + padBox.height * 0.6, {
    steps: 8,
  });
  await page.mouse.up();

  const pageCanvas = page.locator("canvas").nth(1);
  await pageCanvas.scrollIntoViewIfNeeded();
  const pageBox = await pageCanvas.boundingBox();
  if (!pageBox) throw new Error("page preview not visible");
  const cx = 0.6;
  const cy = 0.7;
  await pageCanvas.click({ position: { x: pageBox.width * cx, y: pageBox.height * cy } });
  await expect(page.getByAltText("Signature preview")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Sign PDF" }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  const bytes = new Uint8Array(readFileSync((await download.path()) as string));

  const matrices = await drawnImageMatrices(bytes, 0);
  expect(matrices).toHaveLength(1);
  const m = matrices[0];
  const expectedW = 595 * 0.25;
  const expectedH = expectedW * (180 / 500);
  expect(Math.abs(m.w - expectedW)).toBeLessThan(1);
  expect(Math.abs(m.h - expectedH)).toBeLessThan(1);
  expect(Math.abs(m.x - (cx * 595 - expectedW / 2))).toBeLessThan(4);
  expect(Math.abs(m.y - ((1 - cy) * 842 - expectedH / 2))).toBeLessThan(4);
});
