export function parseRanges(input: string, pageCount: number): number[] {
  const indices = new Set<number>();
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new Error("Enter at least one page or range, e.g. 1-3,7");
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new Error(`Invalid range "${part}" — use forms like 5 or 2-8`);
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : start;
    if (start < 1 || end < start) throw new Error(`Invalid range "${part}"`);
    if (start > pageCount) throw new Error(`Page ${start} is beyond the last page (${pageCount})`);
    for (let i = start; i <= Math.min(end, pageCount); i++) indices.add(i - 1);
  }
  return [...indices].sort((a, b) => a - b);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function stem(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
