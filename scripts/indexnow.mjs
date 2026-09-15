const KEY = "d82f47ba270045ed8608f614caaa3055";
const base = (process.argv[2] ?? "https://pdfairlock.com").replace(/\/$/, "");

const sitemap = await fetch(`${base}/sitemap.xml`, { cache: "no-store" });
if (!sitemap.ok) throw new Error(`sitemap fetch failed: ${sitemap.status}`);
const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error("sitemap listed no urls");

const keyFile = await fetch(`${base}/${KEY}.txt`, { cache: "no-store" });
if (!keyFile.ok || (await keyFile.text()).trim() !== KEY) {
  throw new Error(`key file not served at ${base}/${KEY}.txt`);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(base).host,
    key: KEY,
    keyLocation: `${base}/${KEY}.txt`,
    urlList: urls,
  }),
});
console.log(`indexnow: submitted ${urls.length} urls → HTTP ${res.status} ${await res.text()}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
