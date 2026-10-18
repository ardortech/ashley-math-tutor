import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";

const SolveResponse = z.object({
  overview_hint: z.string(),
  topic: z.string(),
  final_answer: z.string(),
  solution_steps: z.array(z.string()).min(1),
});

type SolveResult = z.infer<typeof SolveResponse>;

const SOLVE_TASK = `你現在的任務是：根據學生確認過的數學題目，準備解題引導資料。

題目風格、用詞和難度請參考${TEXTBOOK}版國一數學課本。

你需要回傳以下 JSON（不要加任何其他文字）：

{
  "overview_hint": "1～2 句話，說明這是哪一類題目、目標是什麼。不可以包含任何數字計算或答案。例：「這是一元一次方程式喔！我們的目標是讓 $x$ 自己站在等號一邊。想想看，要先處理什麼呢？」",
  "topic": "這題所屬的單元名稱",
  "final_answer": "最終答案（精確值）",
  "solution_steps": [
    "第一步的簡短描述（一句話）",
    "第二步的簡短描述（一句話）",
    "..."
  ]
}

重要規則：
- overview_hint 絕對不能包含任何數字計算結果或答案，只能點出題型和目標方向。
- solution_steps 每一步只寫一句簡短描述，說明這一步要做什麼（例如「把含 x 的項移到等號左邊」），不要寫出計算過程。
- final_answer 要精確，接受等價形式（如 $\\frac{3}{2}$ 和 $1.5$）。
- 所有文字用繁體中文、台灣用語。
- 數學式用 LaTeX 寫在 $...$ 裡。`;

async function callSolve(problemText: string): Promise<SolveResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
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

  const startTime = Date.now();
  let result: SolveResult;
  try {
    result = await callSolve(problemText);
  } catch (err) {
    try {
      result = await callSolve(problemText);
    } catch {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[solve] FAILED after ${elapsed}s`);
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `解題分析失敗：${msg}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[solve] OK in ${elapsed}s, ${result.solution_steps.length} steps`);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
