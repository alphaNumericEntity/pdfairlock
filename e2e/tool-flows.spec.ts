import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { makePdf } from "./helpers";

function extractTexts(path: string): string[] {
  const raw = execFileSync("node", [join(__dirname, "inspect-text.ts"), path], {
    encoding: "utf8",
  });
  return JSON.parse(raw.trim().split("\n").at(-1) as string).pageTexts;
}

async function downloadAfter(
  page: import("@playwright/test").Page,
  action: () => Promise<void>,
): Promise<string> {
  const downloadPromise = page.waitForEvent("download");
  await action();
  const download = await downloadPromise;
  return (await download.path()) as string;
}

test("split into every page produces a zip of single-page PDFs", async ({ page }) => {
  await page.goto("/split-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(3) }]);
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Split PDF" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const entries = unzipSync(new Uint8Array(readFileSync(path)));
  const names = Object.keys(entries).sort();
  expect(names).toEqual(["doc-page-1.pdf", "doc-page-2.pdf", "doc-page-3.pdf"]);
  for (const name of names) {
    expect((await PDFDocument.load(entries[name])).getPageCount()).toBe(1);
  }
});

test("split by ranges extracts the chosen pages into one PDF", async ({ page }) => {
  await page.goto("/split-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(5) }]);
  await page.getByRole("combobox").selectOption("ranges");
  await page.getByPlaceholder("e.g. 1-3, 7, 12-14").fill("2-3, 5");
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Split PDF" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const texts = extractTexts(path);
  expect(texts).toEqual(["Fixture page 2", "Fixture page 3", "Fixture page 5"]);
});

test("extract pages pulls a range into a new document", async ({ page }) => {
  await page.goto("/extract-pdf-pages");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(4) }]);
  await page.getByPlaceholder("e.g. 1-3, 7, 12-14").fill("1, 4");
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Extract pages" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  expect(extractTexts(path)).toEqual(["Fixture page 1", "Fixture page 4"]);
});

test("delete pages removes exactly the chosen pages", async ({ page }) => {
  await page.goto("/delete-pdf-pages");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(4) }]);
  await page.getByPlaceholder("e.g. 1-3, 7, 12-14").fill("2-3");
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Delete pages" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  expect(extractTexts(path)).toEqual(["Fixture page 1", "Fixture page 4"]);
});

test("rotate stamps the rotation on every page", async ({ page }) => {
  await page.goto("/rotate-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Rotate PDF" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const doc = await PDFDocument.load(readFileSync(path));
  expect(doc.getPage(0).getRotation().angle).toBe(90);
  expect(doc.getPage(1).getRotation().angle).toBe(90);
});

test("watermark text is drawn onto every page", async ({ page }) => {
  await page.goto("/watermark-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: /Add watermark/ }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const texts = extractTexts(path);
  expect(texts[0]).toContain("CONFIDENTIAL");
  expect(texts[1]).toContain("CONFIDENTIAL");
});

test("page numbers land on every page", async ({ page }) => {
  await page.goto("/add-page-numbers");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(3) }]);
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: /Add page numbers/ }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const texts = extractTexts(path);
  expect(texts[0]).toContain("1 / 3");
  expect(texts[2]).toContain("3 / 3");
});

test("pdf to images produces a zip with one JPEG per page", async ({ page }) => {
  await page.goto("/pdf-to-jpg");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  const path = await downloadAfter(page, async () => {
    await page.getByRole("button", { name: "Convert to images" }).click();
    await page.getByRole("button", { name: "Download", exact: true }).click();
  });
  const entries = unzipSync(new Uint8Array(readFileSync(path)));
  expect(Object.keys(entries).sort()).toEqual(["doc-page-1.jpg", "doc-page-2.jpg"]);
  for (const jpg of Object.values(entries)) {
    expect([jpg[0], jpg[1]]).toEqual([0xff, 0xd8]);
  }
});

test("a single-page pdf converts to a direct jpg download", async ({ page }) => {
  await page.goto("/pdf-to-jpg");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "one.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Convert to images" }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("one-page-1.jpg");
});
