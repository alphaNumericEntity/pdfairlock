import { describe, expect, it } from "vitest";
import { buildReport, bytesContainText } from "@/lib/pdf/redact";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("buildReport", () => {
  it("passes when redacted pages are empty and no terms remain", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", "General terms"],
      outputBytes: bytes("clean output"),
      redactedPages: [1],
      terms: ["secret"],
    });
    expect(report.ok).toBe(true);
    expect(report.textOnRedactedPages).toEqual([]);
    expect(report.termHitsByPage).toEqual({});
    expect(report.termsInBytes).toEqual([]);
  });

  it("fails when a redacted page still has text", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["leftover words", ""],
      outputBytes: bytes("x"),
      redactedPages: [1],
      terms: [],
    });
    expect(report.ok).toBe(false);
    expect(report.textOnRedactedPages).toEqual([1]);
  });

  it("names every page where a term survives, case-insensitively", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", "Contact JANE DOE here", "and jane doe again"],
      outputBytes: bytes("x"),
      redactedPages: [1],
      terms: ["Jane Doe"],
    });
    expect(report.ok).toBe(false);
    expect(report.termHitsByPage["Jane Doe"]).toEqual([2, 3]);
  });

  it("reports a bytes-only hit as the tripwire, not a text hit", () => {
    const report = buildReport({
      mode: "flatten",
      pageTexts: ["", ""],
      outputBytes: bytes("hidden secret-123 in stream"),
      redactedPages: [1, 2],
      terms: ["secret-123"],
    });
    expect(report.ok).toBe(false);
    expect(report.termHitsByPage).toEqual({});
    expect(report.termsInBytes).toEqual(["secret-123"]);
  });

  it("does not double-report a term found in text as a bytes hit", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", "secret-123 visible"],
      outputBytes: bytes("secret-123"),
      redactedPages: [1],
      terms: ["secret-123"],
    });
    expect(report.termHitsByPage["secret-123"]).toEqual([2]);
    expect(report.termsInBytes).toEqual([]);
  });

  it("ignores blank terms", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", ""],
      outputBytes: bytes("x"),
      redactedPages: [1],
      terms: ["  ", ""],
    });
    expect(report.ok).toBe(true);
  });

  it("handles manual-box runs with no terms at all", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", "text stays"],
      outputBytes: bytes("x"),
      redactedPages: [1],
      terms: [],
    });
    expect(report.ok).toBe(true);
  });

  it("tracks multiple terms in mixed states independently", () => {
    const report = buildReport({
      mode: "mixed",
      pageTexts: ["", "alpha here"],
      outputBytes: bytes("beta-in-bytes"),
      redactedPages: [1],
      terms: ["alpha", "beta-in-bytes", "gone"],
    });
    expect(report.termHitsByPage).toEqual({ alpha: [2] });
    expect(report.termsInBytes).toEqual(["beta-in-bytes"]);
    expect(report.ok).toBe(false);
  });
});

describe("bytesContainText", () => {
  it("finds a term regardless of case and surrounding binary", () => {
    const haystack = new Uint8Array([0, 255, ...bytes("Hello SECRET World"), 7]);
    expect(bytesContainText(haystack, "secret")).toBe(true);
  });

  it("returns false when absent", () => {
    expect(bytesContainText(bytes("nothing here"), "secret")).toBe(false);
  });

  it("trims the term before matching", () => {
    expect(bytesContainText(bytes("abc secret xyz"), "  secret  ")).toBe(true);
  });

  it("documents the latin1 limitation: non-latin terms don't match utf-8 bytes", () => {
    expect(bytesContainText(bytes("Ωmega"), "Ω")).toBe(false);
  });
});
