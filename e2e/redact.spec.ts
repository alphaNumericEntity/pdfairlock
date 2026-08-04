import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { makePdf, SECRET } from "./helpers";

test("search-driven redaction destroys the text and burns boxes where it was", async ({ page }) => {
  await page.goto("/redact-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "contract.pdf",
      mimeType: "application/pdf",
      buffer: await makePdf(2, true),
    },
  ]);

  await page.getByPlaceholder("e.g. a name, SSN, email").fill(SECRET);
  await page.getByRole("button", { name: "Mark all matches" }).click();
  await expect(page.getByText(/Marked \d+ match/)).toBeVisible();

  await page.getByRole("button", { name: /Redact .*verify/ }).click();
  await expect(page.getByText("✓ Redaction verified")).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadPromise;
  const saved = join(__dirname, "../test-results/redacted-output.pdf");
  await download.saveAs(saved);

  const raw = execFileSync("node", [join(__dirname, "verify-output.ts"), saved], {
    encoding: "utf8",
  });
  const verdict = JSON.parse(raw.trim().split("\n").at(-1) as string);

  expect(verdict.page1Text).toBe("");
  expect(verdict.page2Text).toContain("Fixture page 2");
  expect(verdict.secretAnywhere).toBe(false);
  expect(verdict.redactedLuma).toBeLessThan(60);
  expect(verdict.untouchedLuma).toBeGreaterThan(150);
});
