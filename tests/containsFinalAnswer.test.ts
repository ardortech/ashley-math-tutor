import { describe, it, expect } from "vitest";
import { containsFinalAnswer } from "../netlify/functions/hint";

const PROBLEM = "3(x − 2) + 5 = 2x + 1";
const ANSWER = "x = 2";

describe("containsFinalAnswer", () => {
  it("should NOT flag a hint that mentions a number from the problem", () => {
    expect(
      containsFinalAnswer(
        "先把 3 乘進括號 (x − 2) 裡",
        ANSWER,
        PROBLEM,
      ),
    ).toBe(false);
  });

  it("should NOT flag a hint mentioning 2x from the problem", () => {
    expect(
      containsFinalAnswer(
        "等號右邊有 $2x + 1$，想想看要怎麼把 x 的項集中？",
        ANSWER,
        PROBLEM,
      ),
    ).toBe(false);
  });

  it("should flag 所以 x = 2", () => {
    expect(
      containsFinalAnswer("所以 x = 2", ANSWER, PROBLEM),
    ).toBe(true);
  });

  it("should flag x = 2 without keywords", () => {
    expect(
      containsFinalAnswer("算出來 $x = 2$，換你試試看！", ANSWER, PROBLEM),
    ).toBe(true);
  });

  it("should flag x=2 without spaces", () => {
    expect(
      containsFinalAnswer("所以x=2", ANSWER, PROBLEM),
    ).toBe(true);
  });

  it("should flag 答案是 2 with keyword", () => {
    expect(
      containsFinalAnswer("答案是 2", ANSWER, PROBLEM),
    ).toBe(true);
  });

  it("should flag 結果是 2 with keyword", () => {
    expect(
      containsFinalAnswer("結果是 2", ANSWER, PROBLEM),
    ).toBe(true);
  });

  it("should NOT flag a number that appears in the problem without keywords", () => {
    expect(
      containsFinalAnswer(
        "把 5 移到等號右邊，變成 $-5$",
        ANSWER,
        PROBLEM,
      ),
    ).toBe(false);
  });

  it("should NOT flag general guidance", () => {
    expect(
      containsFinalAnswer(
        "想想看，要先處理括號還是先移項呢？",
        ANSWER,
        PROBLEM,
      ),
    ).toBe(false);
  });

  it("should handle fractional answers", () => {
    expect(
      containsFinalAnswer(
        "所以 x = 3/2",
        "x = 3/2",
        "2x + 1 = 4",
      ),
    ).toBe(true);
  });

  it("should handle LaTeX fractional answers", () => {
    expect(
      containsFinalAnswer(
        "所以 $x = \\frac{3}{2}$",
        "$x = \\frac{3}{2}$",
        "2x + 1 = 4",
      ),
    ).toBe(true);
  });

  it("should NOT flag answer value that is part of a larger number", () => {
    expect(
      containsFinalAnswer(
        "先算 $3 \\times 12 = 36$",
        "x = 2",
        "3(x − 2) + 5 = 2x + 1",
      ),
    ).toBe(false);
  });

  it("should handle numeric-only answers", () => {
    expect(
      containsFinalAnswer("答案 8", "8", "3 + 5 = ?"),
    ).toBe(true);
  });

  it("should NOT flag that numeric answer when it appears in the problem naturally", () => {
    expect(
      containsFinalAnswer(
        "先看看 8 和 4 的關係",
        "8",
        "求 8 × 4 ÷ 2 + 8 = ?",
      ),
    ).toBe(false);
  });
});
