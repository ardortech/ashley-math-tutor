import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";

const HintRequest = z.object({
  problem_text: z.string(),
  solution_steps: z.array(z.string()),
  step_index: z.number().int().min(0),
  hint_level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  final_answer: z.string(),
  student_thought: z.string().optional(),
  recent_messages: z
    .array(z.object({ role: z.enum(["tutor", "student"]), text: z.string() }))
    .max(6)
    .optional(),
});

const HintResponse = z.object({
  message: z.string(),
});

function buildHintPrompt(input: z.infer<typeof HintRequest>): string {
  const levelLabel = ["", "提問", "方向", "示範一小步"][input.hint_level]!;
  const stepNum = input.step_index + 1;
  const totalSteps = input.solution_steps.length;

  let prompt = `你現在的任務是：給學生「第 ${stepNum} 步（共 ${totalSteps} 步）」的提示。

題目：${input.problem_text}

完整解題步驟：
${input.solution_steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

目前在第 ${stepNum} 步：${input.solution_steps[input.step_index]}

題目風格、用詞和難度請參考${TEXTBOOK}版國一數學課本。

提示等級：${input.hint_level}（${levelLabel}）
`;

  if (input.hint_level === 1) {
    prompt += `\n請用一個引導問題讓學生自己想這一步要怎麼做。不要告訴她做法，只問問題引導她思考。`;
  } else if (input.hint_level === 2) {
    prompt += `\n請點名這一步的解題方向和策略，但不要做計算。例如「試試看把有 x 的都放到等號左邊」。`;
  } else {
    prompt += `\n請示範這一小步的計算過程，用 LaTeX 寫數學式在 $...$ 裡。只做這一步，然後說「接下來換你！」。`;
  }

  if (input.student_thought) {
    prompt += `\n\n學生說了她的想法：「${input.student_thought}」\n請針對她的想法回應，如果想法正確就鼓勵她並引導下一步，如果有錯就溫和地指出哪裡可以再想想。`;
  }

  if (input.recent_messages && input.recent_messages.length > 0) {
    prompt += `\n\n最近的對話：\n`;
    for (const msg of input.recent_messages) {
      const who = msg.role === "tutor" ? "跳跳" : "學生";
      prompt += `${who}：${msg.text}\n`;
    }
  }

  prompt += `\n\n重要規則：
- 一次最多 2～3 句話。
- 數學式用 LaTeX 寫在 $...$ 裡。
- 只用繁體中文和台灣用語。
- 絕對不可以透露最終答案。
- 每次回覆以一個問題或「換你試試看！」結尾（示範步驟除外）。

回傳 JSON：{ "message": "你的回覆" }`;

  return prompt;
}

function stripLatex(s: string): string {
  return s
    .replace(/\$/g, "")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\[a-z]+/gi, "")
    .replace(/[{}]/g, "")
    .trim();
}

function extractAnswerValue(finalAnswer: string): { variable: string; value: string } | null {
  const stripped = stripLatex(finalAnswer);
  const m = stripped.match(/^([a-zA-Z])\s*[=＝]\s*(.+)$/);
  if (m) return { variable: m[1]!, value: m[2]!.trim() };
  const m2 = stripped.match(/^[=＝]\s*(.+)$/);
  if (m2) return { variable: "", value: m2[1]!.trim() };
  if (stripped) return { variable: "", value: stripped };
  return null;
}

export function containsFinalAnswer(
  message: string,
  finalAnswer: string,
  problemText: string,
): boolean {
  const parsed = extractAnswerValue(finalAnswer);
  if (!parsed) return false;

  const { variable, value } = parsed;
  const escapedVal = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escapedVal) return false;

  const msgClean = stripLatex(message);
  const probClean = stripLatex(problemText);

  // Check 1: "variable = value" pattern (e.g. x = 8, x=8)
  if (variable) {
    const varEq = new RegExp(
      `${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[=＝]\\s*${escapedVal}(?![0-9])`,
    );
    if (varEq.test(msgClean)) return true;
  }

  // Check 2: keyword + value (答案/所以/最後/結果 followed by the value)
  const kwPattern = new RegExp(
    `(?:答案|所以|最後|結果)\\s*(?:是|為|[=＝:])?\\s*${escapedVal}(?![0-9])`,
  );
  if (kwPattern.test(msgClean)) return true;

  // Check 3: bare value — only if it does NOT appear in the problem text
  const bareInProblem = new RegExp(`(?<![0-9])${escapedVal}(?![0-9])`).test(probClean);
  if (!bareInProblem) {
    const bareInMsg = new RegExp(`(?<![0-9])${escapedVal}(?![0-9])`).test(msgClean);
    if (bareInMsg) return true;
  }

  return false;
}

async function callHint(input: z.infer<typeof HintRequest>): Promise<string> {
  const client = new Anthropic();
  const userPrompt = buildHintPrompt(input);

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: TUTOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  const parsed = HintResponse.parse(JSON.parse(jsonMatch[0]));
  return parsed.message;
}

const SAFE_FALLBACK = "你已經很接近了！再想想看這一步要怎麼做？";

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  const rl = await checkRateLimit(request);
  if (!rl.ok) return rl.response!;

  let input: z.infer<typeof HintRequest>;
  try {
    const body = await request.json();
    input = HintRequest.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();
  let message: string;

  try {
    message = await callHint(input);

    if (containsFinalAnswer(message, input.final_answer, input.problem_text)) {
      console.log(`[hint] answer leak detected, retrying`);
      message = await callHint(input);

      if (containsFinalAnswer(message, input.final_answer, input.problem_text)) {
        console.log(`[hint] answer leak on retry, using safe fallback`);
        message = SAFE_FALLBACK;
      }
    }
  } catch (err) {
    try {
      message = await callHint(input);
    } catch {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[hint] FAILED after ${elapsed}s`);
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `提示產生失敗：${msg}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[hint] OK in ${elapsed}s, level=${input.hint_level}, step=${input.step_index}`);

  return new Response(JSON.stringify({ message }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
