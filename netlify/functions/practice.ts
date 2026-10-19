import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";

const PracticeRequest = z.object({
  problem_text: z.string(),
  topic: z.string(),
  count: z.union([z.literal(1), z.literal(2)]).default(2),
  difficulty: z.enum(["same", "harder"]).default("same"),
  textbook: z.enum(["康軒", "南一", "翰林"]).optional(),
});

const PracticeProblem = z.object({
  problem_text: z.string(),
  problem_latex: z.string(),
  final_answer: z.string(),
  answer_prefix: z.string(),
});

const PracticeResponse = z.object({
  problems: z.array(PracticeProblem).min(1).max(2),
});

function buildPracticePrompt(input: z.infer<typeof PracticeRequest>): string {
  const difficultyNote =
    input.count === 2
      ? "第 1 題和原題難度相同，第 2 題可以稍微難一點點（但仍在國一範圍內）。"
      : input.difficulty === "harder"
        ? "這題的難度比原題稍微高一點點（但仍在國一範圍內）。"
        : "這題和原題難度相同。";

  return `你現在的任務是：根據學生剛解過的數學題，出 ${input.count} 題同技巧的練習題。

原題：${input.problem_text}
單元：${input.topic}

題目風格、用詞和難度請參考${input.textbook ?? TEXTBOOK}版國一數學課本。

要求：
- 同一個技巧/單元，但用不同的數字和情境
- 答案盡量是整數或簡單分數（如 $\\frac{3}{2}$），不要出現太複雜的小數
- ${difficultyNote}
- 每題都要有 answer_prefix：
  - 如果題目要求解方程式求 x，answer_prefix 是 "x ="
  - 如果求 y 或其他變數，answer_prefix 是 "y =" 等
  - 如果是純計算題（求值），answer_prefix 是 ""
  - 如果是應用題要求一個答案，answer_prefix 是 "答："
- problem_latex 用 LaTeX 寫數學式在 $...$ 裡
- problem_text 是純文字版（給 AI 看的）
- final_answer 是精確答案（例如 "3"、"-2"、"3/2"），不含 answer_prefix

回傳 JSON（不要加任何其他文字）：
{
  "problems": [
    {
      "problem_text": "純文字版題目",
      "problem_latex": "LaTeX 版題目（數學式在 $...$ 裡）",
      "final_answer": "答案",
      "answer_prefix": "x ="
    }
  ]
}

重要：
- 只用繁體中文和台灣用語。
- 不可使用簡體字或大陸用語。
- 答案要正確！請仔細驗算。`;
}

async function callPractice(
  input: z.infer<typeof PracticeRequest>,
): Promise<z.infer<typeof PracticeResponse>> {
  const client = new Anthropic();
  const userPrompt = buildPracticePrompt(input);

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: TUTOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return PracticeResponse.parse(JSON.parse(jsonMatch[0]));
}

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  const rl = await checkRateLimit(request);
  if (!rl.ok) return rl.response!;

  let input: z.infer<typeof PracticeRequest>;
  try {
    const body = await request.json();
    input = PracticeRequest.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();

  try {
    let result = await callPractice(input);

    if (result.problems.length < input.count) {
      const retry = await callPractice(input);
      if (retry.problems.length >= input.count) {
        result = retry;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[practice] OK in ${elapsed}s, count=${result.problems.length}, topic=${input.topic}`,
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    try {
      const result = await callPractice(input);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `[practice] OK (retry) in ${elapsed}s, count=${result.problems.length}`,
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[practice] FAILED after ${elapsed}s`);
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: `練習題產生失敗：${msg}` }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }
}
