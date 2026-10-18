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

function containsFinalAnswer(message: string, finalAnswer: string): boolean {
  const cleaned = finalAnswer
    .replace(/\$/g, "")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\?[a-z]+/gi, "")
    .replace(/[{}\\]/g, "")
    .trim();

  const patterns: string[] = [];

  if (cleaned) patterns.push(cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const eqMatch = finalAnswer.match(/[=＝]\s*(.+)/);
  if (eqMatch) {
    const val = eqMatch[1]!
      .replace(/\$/g, "")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
      .replace(/\\?[a-z]+/gi, "")
      .replace(/[{}\\]/g, "")
      .trim();
    if (val) patterns.push(val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }

  if (patterns.length === 0) return false;

  const answerRegex = new RegExp(
    patterns
      .filter((p) => p.length >= 1)
      .map((p) => `(?:答案|最終|最後|結果|所以)?\\s*(?:[=＝]\\s*)?${p}`)
      .join("|"),
  );

  return answerRegex.test(
    message.replace(/\$/g, "").replace(/\\?[a-z]+/gi, "").replace(/[{}\\]/g, ""),
  );
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

    if (containsFinalAnswer(message, input.final_answer)) {
      console.log(`[hint] answer leak detected, retrying`);
      message = await callHint(input);

      if (containsFinalAnswer(message, input.final_answer)) {
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
