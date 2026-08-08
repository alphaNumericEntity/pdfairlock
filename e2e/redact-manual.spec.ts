import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { makePdf } from "./helpers";

test.use({ viewport: { width: 1280, height: 1800 } });

function extractTexts(path: string): string[] {
  const raw = execFileSync("node", [join(__dirname, "inspect-text.ts"), path], {
    encoding: "utf8",
  });
  return JSON.parse(raw.trim().split("\n").at(-1) as string).pageTexts;
}

async function dragBox(
  page: import("@playwright/test").Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const canvas = page.locator("canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("page canvas not visible");
  await page.mouse.move(box.x + box.width * from.x, box.y + box.height * from.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to.x, box.y + box.height * to.y, { steps: 6 });
  await page.mouse.up();
}

test("manually drawn boxes redact without any search terms", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([
      { name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2, true) },
    ]);
  await expect(page.locator("canvas").first()).toBeVisible();

  await dragBox(page, { x: 0.06, y: 0.11 }, { x: 0.6, y: 0.17 });
  await expect(page.getByRole("button", { name: /Redact 1 area/ })).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Redact 1 area .*verify/ }).click();
  await expect(page.getByText("✓ Redaction verified")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/No search terms to verify/)).toBeVisible();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;

  const texts = extractTexts((await download.path()) as string);
  expect(texts[0]).toBe("");
  expect(texts[1]).toContain("Fixture page 2");
});

test("page navigation lets you redact on page 2 only", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  await expect(page.locator("canvas").first()).toBeVisible();

  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();

  await dragBox(page, { x: 0.05, y: 0.05 }, { x: 0.9, y: 0.12 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Redact 1 area .*verify/ }).click();
  await expect(page.getByText("✓ Redaction verified")).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;

  const texts = extractTexts((await download.path()) as string);
  expect(texts[0]).toContain("Fixture page 1");
  expect(texts[1]).toBe("");

  const report = await page.getByText(/Pages rebuilt as images: 2 of 2/).innerText();
  expect(report).toContain("2 of 2");
});

test("clicking an existing box removes it", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await expect(page.locator("canvas").first()).toBeVisible();

  await dragBox(page, { x: 0.2, y: 0.2 }, { x: 0.5, y: 0.3 });
  await expect(page.getByRole("button", { name: /Redact 1 area/ })).toBeEnabled();

  await page.getByTitle("Click to remove this box").click();
  await expect(page.getByRole("button", { name: /Redact .*verify/ })).toBeDisabled();
});
