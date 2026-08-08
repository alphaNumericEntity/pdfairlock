import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { makePdf } from "./helpers";

test("batch compress produces one result per file and a zip-all download", async ({ page }) => {
  await page.goto("/compress-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: await makePdf(2) },
    { name: "second.pdf", mimeType: "application/pdf", buffer: await makePdf(3) },
  ]);
  await page.getByRole("combobox").selectOption("lossless");
  await page.getByRole("button", { name: "Compress 2 PDFs" }).click();

  await expect(page.getByText("first-compressed.pdf")).toBeVisible();
  await expect(page.getByText("second-compressed.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(2);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download all as .zip" }).click();
  const download = await downloadPromise;
  const entries = unzipSync(new Uint8Array(readFileSync((await download.path()) as string)));
  expect(Object.keys(entries).sort()).toEqual(["first-compressed.pdf", "second-compressed.pdf"]);
  expect((await PDFDocument.load(entries["first-compressed.pdf"])).getPageCount()).toBe(2);
  expect((await PDFDocument.load(entries["second-compressed.pdf"])).getPageCount()).toBe(3);
});

test("batch rotate hides per-page ranges and rotates every file", async ({ page }) => {
  await page.goto("/rotate-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer: await makePdf(1) },
    { name: "b.pdf", mimeType: "application/pdf", buffer: await makePdf(2) },
  ]);
  await expect(page.getByText(/Rotating all pages of every file/)).toBeVisible();
  await page.getByRole("button", { name: "Rotate 2 PDFs" }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Download all as .zip" })).toBeVisible();
});
