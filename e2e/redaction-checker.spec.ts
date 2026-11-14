import { deflateSync } from "node:zlib";
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

function contentStream(lines: string[]): Buffer {
  const ops = lines.map((line) => `(${line}) Tj T*`).join("\n");
  const data = deflateSync(Buffer.from(`BT /F1 11 Tf 72 720 Td 14 TL\n${ops}\nET\n`, "latin1"));
  return Buffer.concat([
    Buffer.from(`<< /Length ${data.length} /Filter /FlateDecode >>\nstream\n`),
    data,
    Buffer.from("\nendstream"),
  ]);
}

function xrefEntry(offset: number): string {
  return `${String(offset).padStart(10, "0")} 00000 n \n`;
}

function incrementallyEdited(original: string, replacement: string): Buffer {
  const lines = (middle: string) => ["Claimant record, copy for release", middle, "Status: closed"];
  const objects = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    ),
    contentStream(lines(original)),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
  ];
  const parts = [Buffer.from("%PDF-1.5\n")];
  const offsets: number[] = [];
  let length = parts[0].length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const obj = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from("\nendobj\n")]);
    parts.push(obj);
    length += obj.length;
  });
  const xrefAt = length;
  const firstTail = Buffer.from(
    `xref\n0 6\n0000000000 65535 f \n${offsets.map(xrefEntry).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`,
  );
  parts.push(firstTail);
  length += firstTail.length;

  const update = Buffer.concat([
    Buffer.from("4 0 obj\n"),
    contentStream(lines(replacement)),
    Buffer.from("\nendobj\n"),
  ]);
  const updateTail = Buffer.from(
    `xref\n0 1\n0000000000 65535 f \n4 1\n${xrefEntry(length)}trailer\n<< /Size 6 /Root 1 0 R /Prev ${xrefAt} >>\nstartxref\n${length + update.length}\n%%EOF\n`,
  );
  return Buffer.concat([...parts, update, updateTail]);
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
  await expect(page.getByText("No earlier versions are saved inside this file.")).toBeVisible();
});

test("text removed by an edit saved on top of the original is found in the earlier version", async ({
  page,
}) => {
  const secret = "Marigold-Vance-447-26-8891";
  const buffer = incrementallyEdited(`Name and SSN: ${secret}`, "Name and SSN: [REDACTED]");
  await page.goto("/pdf-redaction-checker");
  await page
    .locator('input[type="file"]')
    .setInputFiles([{ name: "edited.pdf", mimeType: "application/pdf", buffer }]);
  await expect(page.getByText("Not properly redacted")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("code", { hasText: secret })).toBeVisible();

  await page.getByPlaceholder("e.g. Jane Exampleton, 000-00-0000").fill(secret);
  await page.getByRole("button", { name: "Check again" }).click();
  await expect(page.getByText(/still in an earlier version saved inside this file/)).toBeVisible({
    timeout: 30_000,
  });
});
