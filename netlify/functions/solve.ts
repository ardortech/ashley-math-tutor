import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";

const HintStep = z.object({
  question: z.string(),
  direction: z.string(),
  demo: z.string(),
});

const SolveResponse = z.object({
  overview_hint: z.string(),
  topic: z.string(),
  final_answer: z.string(),
  solution_steps: z.array(z.string()).min(1),
  hint_ladder: z.array(HintStep).min(1),
});

type SolveResult = z.infer<typeof SolveResponse>;

const SOLVE_TASK = `你現在的任務是：根據學生確認過的數學題目，準備完整的解題引導資料。

題目風格、用詞和難度請參考${TEXTBOOK}版國一數學課本。

你需要回傳以下 JSON（不要加任何其他文字）：

{
  "overview_hint": "1～2 句話，說明這是哪一類題目、目標是什麼。不可以包含任何數字計算或答案。例：「這是一元一次方程式喔！我們的目標是讓 $x$ 自己站在等號一邊。想想看，要先處理什麼呢？」",
  "topic": "這題所屬的單元名稱",
  "final_answer": "最終答案（精確值）",
  "solution_steps": [
    "第一步的描述",
    "第二步的描述",
    "..."
  ],
  "hint_ladder": [
    {
      "question": "引導問題（讓學生自己想的問句）",
      "direction": "解題方向（點名策略但不做計算）",
      "demo": "示範這一小步（只做這一步，用 LaTeX 寫數學式在 $...$ 裡）"
    }
  ]
}

重要規則：
- overview_hint 絕對不能包含任何數字計算結果或答案，只能點出題型和目標方向。
- solution_steps 和 hint_ladder 的數量要一致，每一步對應一個 hint。
- hint_ladder 的三個層級要循序漸進：question 最少提示、direction 點出策略、demo 示範一小步。
- demo 中用 LaTeX 寫數學式在 $...$ 裡。
- final_answer 要精確，接受等價形式（如 $\\frac{3}{2}$ 和 $1.5$）。
- 所有文字用繁體中文、台灣用語。`;

async function callSolve(problemText: string): Promise<SolveResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: TUTOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `以下是學生確認過的題目：\n\n${problemText}\n\n${SOLVE_TASK}`,
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return SolveResponse.parse(JSON.parse(jsonMatch[0]));
}

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  const rl = await checkRateLimit(request);
  if (!rl.ok) return rl.response!;

  let problemText: string;
  try {
    const body = (await request.json()) as { problem_text?: string };
    if (!body.problem_text || typeof body.problem_text !== "string") {
      return new Response(JSON.stringify({ error: "Missing problem_text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    problemText = body.problem_text;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let result: SolveResult;
  try {
    result = await callSolve(problemText);
  } catch (err) {
    try {
      result = await callSolve(problemText);
    } catch {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `解題分析失敗：${msg}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
