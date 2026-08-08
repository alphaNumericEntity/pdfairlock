import { describe, expect, it } from "vitest";
import { formatBytes, parseRanges, stem } from "@/lib/pdf/ranges";

describe("parseRanges", () => {
  it("parses singles, ranges and mixes, 1-indexed to 0-indexed", () => {
    expect(parseRanges("1-3, 7", 10)).toEqual([0, 1, 2, 6]);
  });

  it("dedupes overlaps and sorts", () => {
    expect(parseRanges("3, 1-4, 2", 10)).toEqual([0, 1, 2, 3]);
  });

  it("clamps a range end past the last page", () => {
    expect(parseRanges("8-99", 10)).toEqual([7, 8, 9]);
  });

  it("rejects a start past the last page", () => {
    expect(() => parseRanges("11", 10)).toThrow(/beyond the last page/);
  });

  it("rejects junk", () => {
    expect(() => parseRanges("abc", 10)).toThrow(/invalid range/i);
    expect(() => parseRanges("5-2", 10)).toThrow(/invalid/i);
    expect(() => parseRanges("", 10)).toThrow(/at least one/i);
    expect(() => parseRanges("0", 10)).toThrow(/invalid/i);
    expect(() => parseRanges("  ,  ,", 10)).toThrow(/at least one/i);
    expect(() => parseRanges("1--3", 10)).toThrow(/invalid range/i);
    expect(() => parseRanges("-2", 10)).toThrow(/invalid range/i);
  });

  it("accepts spaces inside ranges", () => {
    expect(parseRanges(" 1 - 3 , 5 ", 10)).toEqual([0, 1, 2, 4]);
  });

  it("treats a one-page range as a single page", () => {
    expect(parseRanges("4-4", 10)).toEqual([3]);
  });
});

describe("formatBytes", () => {
  it("picks sane units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("handles zero and the GB tier", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.00 GB");
  });
});

describe("stem", () => {
  it("strips the extension only", () => {
    expect(stem("report.v2.pdf")).toBe("report.v2");
    expect(stem("noext")).toBe("noext");
  });
});
