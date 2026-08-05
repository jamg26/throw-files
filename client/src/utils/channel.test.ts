import { describe, expect, test } from "vitest";
import {
  CHANNEL_CODE_LENGTH,
  generateChannelCode,
  isValidChannelCode,
  normalizeChannelCode,
} from "./channel";

describe("normalizeChannelCode", () => {
  test("uppercases lowercase input", () => {
    expect(normalizeChannelCode("abc123")).toBe("ABC123");
  });

  test("strips characters outside A-Z0-9", () => {
    expect(normalizeChannelCode("a-b_c 1!")).toBe("ABC1");
  });

  test("truncates to the channel code length", () => {
    expect(normalizeChannelCode("ABCDEFGHIJ")).toBe("ABCDEF");
  });

  test("returns an empty string for non-string input", () => {
    expect(normalizeChannelCode(null)).toBe("");
    expect(normalizeChannelCode(undefined)).toBe("");
  });

  test("normalizes an already-decoded query value", () => {
    // URLSearchParams.get() percent-decodes for us, so normalize only has to
    // deal with the decoded form.
    expect(normalizeChannelCode("ab c-1")).toBe("ABC1");
  });
});

describe("isValidChannelCode", () => {
  test("accepts exactly six uppercase alphanumerics", () => {
    expect(isValidChannelCode("AB12CD")).toBe(true);
  });

  test("rejects codes shorter than the required length", () => {
    expect(isValidChannelCode("A")).toBe(false);
    expect(isValidChannelCode("ABC12")).toBe(false);
  });

  test("rejects codes longer than the required length", () => {
    expect(isValidChannelCode("ABC1234")).toBe(false);
  });

  test("rejects lowercase codes", () => {
    expect(isValidChannelCode("abc123")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isValidChannelCode("")).toBe(false);
  });
});

describe("generateChannelCode", () => {
  test("produces a code that passes validation", () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidChannelCode(generateChannelCode())).toBe(true);
    }
  });

  test("produces codes of the declared length", () => {
    expect(generateChannelCode()).toHaveLength(CHANNEL_CODE_LENGTH);
  });

  test("does not return the same code every call", () => {
    const seen = new Set(
      Array.from({ length: 50 }, () => generateChannelCode()),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});
