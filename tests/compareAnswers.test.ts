import { describe, it, expect } from "vitest";
import { compareAnswers } from "../src/lib/compareAnswers";

describe("compareAnswers", () => {
  it("3/2 vs 1.5 → equal", () => {
    expect(compareAnswers("3/2", "1.5")).toBe("equal");
  });

  it("-2 vs x=-2 → equal", () => {
    expect(compareAnswers("-2", "x=-2")).toBe("equal");
  });

  it("6/4 vs 3/2 → equal", () => {
    expect(compareAnswers("6/4", "3/2")).toBe("equal");
  });

  it("0.5 vs 1/3 → different", () => {
    expect(compareAnswers("0.5", "1/3")).toBe("different");
  });

  it("x = 5 vs 5 → equal", () => {
    expect(compareAnswers("x = 5", "5")).toBe("equal");
  });

  it("x＝3 vs x = 3 → equal", () => {
    expect(compareAnswers("x＝3", "x = 3")).toBe("equal");
  });

  it("答：7 vs 7 → equal", () => {
    expect(compareAnswers("答：7", "7")).toBe("equal");
  });

  it("-3/6 vs -1/2 → equal", () => {
    expect(compareAnswers("-3/6", "-1/2")).toBe("equal");
  });

  it("2 vs 3 → different", () => {
    expect(compareAnswers("2", "3")).toBe("different");
  });

  it("abc vs def → unknown", () => {
    expect(compareAnswers("abc", "def")).toBe("unknown");
  });

  it("same string expression → equal", () => {
    expect(compareAnswers("2x + 1", "2x + 1")).toBe("equal");
  });

  it("whitespace-normalized string expression → equal", () => {
    expect(compareAnswers("2x + 1", "2x+1")).toBe("equal");
  });

  it("empty vs empty → unknown", () => {
    expect(compareAnswers("", "")).toBe("unknown");
  });

  it("0 vs 0 → equal", () => {
    expect(compareAnswers("0", "0")).toBe("equal");
  });

  it("-0.5 vs -1/2 → equal", () => {
    expect(compareAnswers("-0.5", "-1/2")).toBe("equal");
  });
});
