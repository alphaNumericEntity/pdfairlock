import { expect, test } from "@playwright/test";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

async function fakeRedaction(withBox: boolean): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setAuthor("HR Department");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText("Employee record", { x: 60, y: 720, size: 18, font });
  page.drawText("Name: Jane Exampleton", { x: 60, y: 680, size: 12, font });
  page.drawText("Date of birth: 04 April 1980", { x: 60, y: 660, size: 12, font });
  if (withBox) {
    const nameWidth = font.widthOfTextAtSize("Jane Exampleton", 12);
    const nameStart = 60 + font.widthOfTextAtSize("Name: ", 12);
    page.drawRectangle({
      x: nameStart - 2,
      y: 676,
      width: nameWidth + 4,
      height: 15,
      color: rgb(0, 0, 0),
    });
  }
  return Buffer.from(await doc.save());
}

test("a black rectangle drawn over text is reported as a leak, with the words", async ({
  page,
}) => {
  const buffer = await fakeRedaction(true);
  await page.goto("/pdf-redaction-checker");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "fake-redaction.pdf", mimeType: "application/pdf", buffer }]);
  await expect(page.getByText("Not properly redacted")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("code", { hasText: "Jane Exampleton" })).toBeVisible();
  await expect(page.getByText(/Author:/)).toBeVisible();

  await page.getByPlaceholder("e.g. Jane Exampleton, 000-00-0000").fill("Exampleton, 000-00-0000");
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(page.getByText(/still appears on page\(s\) 1/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/not found anywhere in the file/)).toBeVisible();
});

test("a page without boxes is not called a leak", async ({ page }) => {
  await page.goto("/pdf-redaction-checker");
  await page
    .locator('input[type="file"]')
    .setInputFiles([
      { name: "plain.pdf", mimeType: "application/pdf", buffer: await fakeRedaction(false) },
    ]);
  await expect(page.getByText("No dark boxes were found on any page.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Not properly redacted")).toHaveCount(0);
});
