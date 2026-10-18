#!/usr/bin/env node

/**
 * Test script for /api/analyze and /api/solve endpoints.
 *
 * Usage:
 *   node tests/test-api.mjs <base-url> <pin> [image-path]
 *
 * Examples:
 *   # Test analyze with an image file:
 *   node tests/test-api.mjs http://localhost:8888 1234 tests/samples/equation.jpg
 *
 *   # Test solve only (no image needed):
 *   node tests/test-api.mjs http://localhost:8888 1234 --solve "解方程式 3x + 5 = 14"
 */

import { readFileSync } from "fs";

const [, , baseUrl, pin, ...rest] = process.argv;

if (!baseUrl || !pin) {
  console.error("Usage: node tests/test-api.mjs <base-url> <pin> [image-path | --solve <text>]");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "x-app-pin": pin,
  "x-device-id": "test-device",
};

async function testAnalyze(imagePath) {
  console.log("\n=== /api/analyze ===");
  console.log(`Image: ${imagePath}`);

  const imageData = readFileSync(imagePath);
  const base64 = imageData.toString("base64");

  const res = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify({ image: base64 }),
  });

  console.log(`Status: ${res.status}`);
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));

  if (res.ok && body.problems) {
    console.log(`\nFound ${body.problems.length} problem(s)`);
    for (const [i, p] of body.problems.entries()) {
      console.log(`  ${i + 1}. [${p.topic}] ${p.problem_text}`);
    }
    return body.problems[0];
  }
  return null;
}

async function testSolve(problemText) {
  console.log("\n=== /api/solve ===");
  console.log(`Problem: ${problemText}`);

  const res = await fetch(`${baseUrl}/api/solve`, {
    method: "POST",
    headers,
    body: JSON.stringify({ problem_text: problemText }),
  });

  console.log(`Status: ${res.status}`);
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));

  if (res.ok) {
    console.log("\n--- Check: overview_hint should NOT contain numbers/answers ---");
    console.log(`overview_hint: ${body.overview_hint}`);
    console.log(`final_answer: ${body.final_answer}`);
    console.log(`steps: ${body.solution_steps?.length}`);
    console.log(`hints: ${body.hint_ladder?.length}`);

    if (body.overview_hint.includes(body.final_answer)) {
      console.error("WARNING: overview_hint contains the final answer!");
    }
  }
}

async function main() {
  if (rest[0] === "--solve" && rest[1]) {
    await testSolve(rest[1]);
  } else if (rest[0] && rest[0] !== "--solve") {
    const problem = await testAnalyze(rest[0]);
    if (problem) {
      await testSolve(problem.problem_text);
    }
  } else {
    // Default: test solve with a sample problem
    await testSolve("解方程式 $3x + 5 = 14$");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
