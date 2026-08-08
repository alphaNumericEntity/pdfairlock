import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { makePdf } from "./helpers";

test("protect then unlock roundtrips through the UI", async ({ page }) => {
  await page.goto("/protect-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(2) }]);
  await page.getByLabel("New password").fill("hunter2");
  await page.getByLabel("Confirm password").fill("hunter2");
  const protectDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Add password/ }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const protectedPath = (await (await protectDownload).path()) as string;
  const protectedBytes = readFileSync(protectedPath);

  const encrypted = await PDFDocument.load(new Uint8Array(protectedBytes), {
    ignoreEncryption: true,
  });
  expect(encrypted.isEncrypted).toBe(true);

  await page.goto("/unlock-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([
      { name: "doc-protected.pdf", mimeType: "application/pdf", buffer: protectedBytes },
    ]);
  await page.getByLabel("Password").fill("hunter2");
  const unlockDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Remove password" }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const unlockedBytes = readFileSync((await (await unlockDownload).path()) as string);

  const unlocked = await PDFDocument.load(new Uint8Array(unlockedBytes));
  expect(unlocked.isEncrypted).toBe(false);
  expect(unlocked.getPageCount()).toBe(2);
});

test("a wrong password shows a friendly error instead of a download", async ({ page }) => {
  await page.goto("/protect-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await page.getByLabel("New password").fill("correct");
  await page.getByLabel("Confirm password").fill("correct");
  const protectDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Add password/ }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const protectedBytes = readFileSync((await (await protectDownload).path()) as string);

  await page.goto("/unlock-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "locked.pdf", mimeType: "application/pdf", buffer: protectedBytes }]);
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Remove password" }).click();
  await expect(page.getByText(/password looks incorrect/i)).toBeVisible();
});

test("mismatched confirm password is caught before running", async ({ page }) => {
  await page.goto("/protect-pdf");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "doc.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }]);
  await page.getByLabel("New password").fill("one");
  await page.getByLabel("Confirm password").fill("two");
  await page.getByRole("button", { name: /Add password/ }).click();
  await expect(page.getByText("The passwords don't match.")).toBeVisible();
});
