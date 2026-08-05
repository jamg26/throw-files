import { describe, expect, test } from "vitest";
import { formatFileSize, trimFileName } from "./format";

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

describe("formatFileSize", () => {
  test("renders zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  test("renders raw bytes below a kilobyte", () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  test("renders whole kilobytes without a decimal", () => {
    expect(formatFileSize(KB)).toBe("1 KB");
  });

  test("renders one fractional digit", () => {
    expect(formatFileSize(1.5 * KB)).toBe("1.5 KB");
  });

  test("renders gigabytes", () => {
    expect(formatFileSize(5 * GB)).toBe("5 GB");
  });

  test("clamps negative input to zero rather than emitting NaN", () => {
    expect(formatFileSize(-1)).toBe("0 B");
  });

  test("does not emit undefined for absurdly large input", () => {
    expect(formatFileSize(Number.MAX_SAFE_INTEGER)).not.toContain("undefined");
  });

  test("handles non-finite input", () => {
    expect(formatFileSize(Number.NaN)).toBe("0 B");
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("0 B");
  });
});

describe("trimFileName", () => {
  test("leaves a short name untouched", () => {
    expect(trimFileName("report.pdf", 24)).toBe("report.pdf");
  });

  test("preserves the extension when shortening", () => {
    expect(trimFileName(`${"a".repeat(40)}.pdf`, 24)).toMatch(/\.pdf$/);
  });

  test("never returns more characters than the limit", () => {
    const names = [
      `${"a".repeat(80)}.pdf`,
      "a".repeat(80),
      `${"a".repeat(50)}.${"b".repeat(40)}`,
      `${"n".repeat(10)}.${"e".repeat(200)}`,
      ".gitignore",
      "archive.tar.gz",
      `${"x".repeat(30)}.`,
    ];
    for (const name of names) {
      expect(trimFileName(name, 24).length).toBeLessThanOrEqual(24);
    }
  });

  test("truncates a name that has no extension", () => {
    const trimmed = trimFileName("a".repeat(80), 24);
    expect(trimmed).toHaveLength(24);
    expect(trimmed.endsWith("…")).toBe(true);
  });

  test("keeps a dotfile recognisable", () => {
    expect(trimFileName(".gitignore", 24)).toBe(".gitignore");
  });

  test("returns an empty string for empty input", () => {
    expect(trimFileName("", 24)).toBe("");
  });
});
