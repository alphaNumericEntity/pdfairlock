import { PDFDocument, StandardFonts } from "pdf-lib";

export const SECRET = "SECRET-ALPHA-12345";

export async function makePdf(pages: number, withSecretOnPage1 = false): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Fixture page ${i + 1}`, { x: 60, y: 780, size: 24, font });
    if (i === 0 && withSecretOnPage1) {
      page.drawText(`Employee SSN: ${SECRET}`, { x: 60, y: 720, size: 14, font });
    }
  }
  return Buffer.from(await doc.save());
}
