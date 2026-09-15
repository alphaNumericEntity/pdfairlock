import { expect, test } from "@playwright/test";
import { makePdf } from "./helpers";

test("the wifi-off demo: after one visit, merging works fully offline", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit doesn't emulate SW+offline; verify in real Safari post-deploy",
  );
  await page.goto("/merge-pdf");
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, undefined, {
    timeout: 60_000,
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /Merge PDF files/ })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer: await makePdf(2) },
    { name: "b.pdf", mimeType: "application/pdf", buffer: await makePdf(1) },
  ]);
  await page.getByRole("button", { name: "Merge 2 PDFs" }).click();
  await expect(page.getByRole("button", { name: "Download", exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await context.setOffline(false);
});
