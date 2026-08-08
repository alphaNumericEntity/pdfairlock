import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { makePdf } from "./helpers";

test("a fake pdf shows a readable error, not a crash", async ({ page }) => {
  await page.goto("/merge-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "real.pdf", mimeType: "application/pdf", buffer: await makePdf(1) },
    {
      name: "fake.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("this is not a pdf at all"),
    },
  ]);
  await page.getByRole("button", { name: "Merge 2 PDFs" }).click();
  await expect(page.getByText(/could not read this file/i)).toBeVisible();
});

test("an encrypted pdf points the user at the unlock tool", async ({ page }) => {
  await page.goto("/protect-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await page.getByLabel("New password").fill("pw");
  await page.getByLabel("Confirm password").fill("pw");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Add password/ }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const encryptedBytes = readFileSync((await (await downloadPromise).path()) as string);

  await page.goto("/merge-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "locked.pdf", mimeType: "application/pdf", buffer: encryptedBytes },
    { name: "open.pdf", mimeType: "application/pdf", buffer: await makePdf(1) },
  ]);
  await page.getByRole("button", { name: "Merge 2 PDFs" }).click();
  await expect(page.getByText(/Unlock PDF tool/)).toBeVisible();
});

test("searching a term that isn't in the document explains what to do", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await page.getByPlaceholder("e.g. a name, SSN, email").fill("definitely-not-present");
  await page.getByRole("button", { name: "Mark all matches" }).click();
  await expect(page.getByText(/not found in the text layer/)).toBeVisible();
});

test("redact button stays disabled until a box exists", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await expect(page.getByRole("button", { name: /Redact .*verify/ })).toBeDisabled();
});
