import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { makePdf } from "./helpers";

test("merge two PDFs into a five-page file", async ({ page }) => {
  await page.goto("/merge-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer: await makePdf(2) },
    { name: "b.pdf", mimeType: "application/pdf", buffer: await makePdf(3) },
  ]);
  await page.getByRole("button", { name: "Merge 2 PDFs" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();

  const merged = await PDFDocument.load(readFileSync(path as string));
  expect(merged.getPageCount()).toBe(5);
  expect(download.suggestedFilename()).toBe("a-merged.pdf");
});
