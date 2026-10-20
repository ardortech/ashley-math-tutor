import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function collectFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const emojiPattern =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;

describe("no emoji in source files", () => {
  const srcDir = path.resolve(__dirname, "../src");
  const files = collectFiles(srcDir, [".ts", ".tsx"]);

  it("should find source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("should not contain emoji characters", () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (emojiPattern.test(lines[i])) {
          const rel = path.relative(srcDir, file);
          violations.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }
    expect(violations, `Emoji found in source files:\n${violations.join("\n")}`).toHaveLength(0);
  });
});
