import { describe, it, expect } from "vitest";
import { normalizeAnswer, answersMatch } from "./normalizeAnswer";

describe("normalizeAnswer", () => {
  it("strips half-width spaces", () => {
    expect(normalizeAnswer(" 及")).toBe("及");
    expect(normalizeAnswer("及 ")).toBe("及");
    expect(normalizeAnswer(" 及 ")).toBe("及");
  });

  it("strips full-width spaces", () => {
    expect(normalizeAnswer("　及")).toBe("及");
  });

  it("keeps the character itself intact", () => {
    expect(normalizeAnswer("及")).toBe("及");
  });

  it("handles multi-char answers", () => {
    expect(normalizeAnswer("祟祟")).toBe("祟祟");
    expect(normalizeAnswer("祟 祟")).toBe("祟祟");
  });
});

describe("answersMatch", () => {
  it("matches identical characters", () => {
    expect(answersMatch("及", "及")).toBe(true);
  });

  it("matches with leading/trailing spaces", () => {
    expect(answersMatch(" 及", "及")).toBe(true);
    expect(answersMatch("及 ", "及")).toBe(true);
  });

  it("matches multi-char from separate inputs", () => {
    expect(answersMatch("祟祟", "祟祟")).toBe(true);
  });

  it("rejects wrong character", () => {
    expect(answersMatch("急", "及")).toBe(false);
  });

  it("rejects partial match on multi-char", () => {
    expect(answersMatch("祟崇", "祟祟")).toBe(false);
  });
});
