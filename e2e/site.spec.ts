import { expect, test } from "@playwright/test";

const TOOL_SLUGS = [
  "merge-pdf",
  "split-pdf",
  "extract-pdf-pages",
  "delete-pdf-pages",
  "rotate-pdf",
  "compress-pdf",
  "redact-pdf",
  "sign-pdf",
  "unlock-pdf",
  "protect-pdf",
  "jpg-to-pdf",
  "pdf-to-jpg",
  "watermark-pdf",
  "add-page-numbers",
];

const ALTERNATIVE_SLUGS = [
  "ilovepdf-alternative",
  "smallpdf-alternative",
  "adobe-acrobat-alternative",
  "pdf24-alternative",
  "sejda-alternative",
  "stirling-pdf-alternative",
];

test("pricing page is free-beta only — no dollar amounts anywhere", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: "Everything is free right now" })).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\$\s?\d/);
  expect(body).toContain("one-time purchase, never a subscription");
  await expect(page.getByText(/activate|license key/i)).toHaveCount(0);
});

test("landing grid links to all 14 tools", async ({ page }) => {
  await page.goto("/");
  const grid = page.locator("#tools ul li a");
  await expect(grid).toHaveCount(14);
  for (const slug of TOOL_SLUGS) {
    await expect(page.locator(`#tools a[href="/${slug}"]`)).toHaveCount(1);
  }
});

test("every tool page serves canonical + FAQ JSON-LD + privacy badge", async ({ request }) => {
  for (const slug of TOOL_SLUGS) {
    const res = await request.get(`/${slug}`);
    expect(res.status(), slug).toBe(200);
    const html = await res.text();
    expect(html, slug).toContain(`rel="canonical" href="https://pdfairlock.com/${slug}"`);
    expect(html, slug).toContain('"@type":"FAQPage"');
    expect(html, slug).toContain("nothing is uploaded");
  }
});

test("sitemap lists every page", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = xml.match(/<loc>/g) ?? [];
  expect(locs.length).toBe(TOOL_SLUGS.length + 6 + ALTERNATIVE_SLUGS.length);
  for (const slug of ALTERNATIVE_SLUGS) {
    expect(xml).toContain(`https://pdfairlock.com/${slug}`);
  }
  for (const slug of TOOL_SLUGS) {
    expect(xml).toContain(`https://pdfairlock.com/${slug}`);
  }
});

test("content pages render with their headings", async ({ page }) => {
  await page.goto("/why-not-upload-pdfs");
  await expect(page.getByRole("heading", { name: /Is it safe to upload PDFs/ })).toBeVisible();
  await page.goto("/pdf-redaction-for-law-firms");
  await expect(page.getByRole("heading", { name: /redaction for law firms/ })).toBeVisible();
  await page.goto("/compare");
  await expect(page.getByRole("heading", { name: /honest comparison/ })).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body).toContain("iLovePDF");
  expect(body).toContain("Stirling");
});

test("every alternative page serves canonical, faq schema, and a migration table", async ({
  request,
}) => {
  for (const slug of ALTERNATIVE_SLUGS) {
    const res = await request.get(`/${slug}`);
    expect(res.status(), slug).toBe(200);
    const html = await res.text();
    expect(html, slug).toContain(`rel="canonical" href="https://pdfairlock.com/${slug}"`);
    expect(html, slug).toContain('"@type":"FAQPage"');
    expect(html, slug).toContain("On PDFAirlock");
    expect(html, slug).toContain("When to stay with");
  }
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("body switches to the dark palette", async ({ page }) => {
    await page.goto("/");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(14, 17, 22)");
  });
});

test.describe("light mode", () => {
  test.use({ colorScheme: "light" });
  test("body keeps the paper palette", async ({ page }) => {
    await page.goto("/");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(250, 250, 248)");
  });
});
