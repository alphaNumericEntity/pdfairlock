import { expect, test } from "@playwright/test";
import { makePdf } from "./helpers";

test("processing a file makes zero non-local network requests", async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (!req.url().startsWith(baseURL as string)) external.push(req.url());
  });

  await page.goto("/compress-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible({
    timeout: 60_000,
  });

  expect(external).toEqual([]);
});
