import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";
import { containsFinalAnswer } from "./hint";

const ValidateRequest = z.object({
  image: z.string(),
  problem_text: z.string(),
  final_answer: z.string(),
  solution_steps: z.array(z.string()),
  attempt: z.number().int().min(1),
});

const ValidateResponse = z.object({
  result: z.enum(["correct", "partially_correct", "incorrect", "unreadable"]),
  lines: z.array(z.string()),
  first_error_line_index: z.number().int().min(0).nullable(),
  related_step_index: z.number().int().min(0).nullable(),
  feedback: z.string(),
});

function buildValidatePrompt(input: z.infer<typeof ValidateRequest>): string {
  const stepsText = input.solution_steps
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  let prompt = `你的任務是批改學生的手寫數學算式。

題目：${input.problem_text}

正確解法步驟：
${stepsText}

正確最終答案：${input.final_answer}

題目風格、用詞和難度請參考${TEXTBOOK}版國一數學課本。

請仔細看學生拍的算式照片，然後：
1. 把她寫的每一行轉成文字（數學式用 LaTeX 寫在 $...$ 裡）放進 lines 陣列
2. 檢查最終答案是否正確（等值的答案都算對，例如 $3/2$、$1.5$、$\\frac{3}{2}$ 都一樣）
3. 檢查每一行的計算過程是否正確，找出第一行有錯的地方

判定規則：
- "correct"：最終答案對，過程也合理
- "partially_correct"：最終答案對，但有某一行寫法有問題（仍算解出來，但要提醒她）
- "incorrect"：最終答案錯，或過程有重大錯誤導致答案錯
- "unreadable"：照片看不清楚，無法判斷

related_step_index：錯誤那一行對應到「正確解法步驟」的第幾步（0-indexed），如果沒有明確對應就給 null。

`;

  if (input.attempt < 3) {
    prompt += `feedback 規則（這是第 ${input.attempt} 次嘗試）：
- 答對了：稱讚她的努力和方法（不要說「你好聰明」）
- partially_correct：稱讚她答案對了，但溫柔提醒有問題的那一行可以再注意
- 答錯了：只指出「哪一行」可以再檢查，不能說出正確答案或怎麼改。用「再看一次」的語氣
- 看不清楚：請她再拍一次，光線亮一點
- 絕對不可以透露正確答案或正確的計算方式！`;
  } else {
    prompt += `feedback 規則（這是第 ${input.attempt} 次嘗試，可以多給一點幫助）：
- 答對了：稱讚她的努力和方法
- partially_correct：稱讚她答案對了，溫柔提醒有問題的那一行
- 答錯了：溫柔地示範錯的那一步怎麼改，用 LaTeX 寫數學式在 $...$ 裡
- 看不清楚：請她再拍一次`;
  }

  prompt += `

一次最多 2～3 句話。只用繁體中文和台灣用語。

回傳 JSON：
{
  "result": "correct" | "partially_correct" | "incorrect" | "unreadable",
  "lines": ["她寫的第 1 行", "第 2 行", ...],
  "first_error_line_index": number | null,
  "related_step_index": number | null,
  "feedback": "給她的話"
}`;

  return prompt;
}

const SAFE_FEEDBACK_INCORRECT =
  "這一行可以再檢查一次看看喔！仔細看看計算有沒有哪裡怪怪的。";
const SAFE_FEEDBACK_PARTIAL =
  "答案對了！不過有一行的寫法可以再注意一下喔。";

async function callValidate(
  input: z.infer<typeof ValidateRequest>,
): Promise<z.infer<typeof ValidateResponse>> {
  const client = new Anthropic();
  const userPrompt = buildValidatePrompt(input);

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: TUTOR_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: input.image,
            },
          },
          { type: "text", text: userPrompt },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  return ValidateResponse.parse(JSON.parse(jsonMatch[0]));
}

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  const rl = await checkRateLimit(request);
  if (!rl.ok) return rl.response!;

  let input: z.infer<typeof ValidateRequest>;
  try {
    const body = await request.json();
    input = ValidateRequest.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();

  try {
    let result = await callValidate(input);

    if (
      input.attempt < 3 &&
      result.result !== "correct" &&
      result.result !== "unreadable"
    ) {
      if (
        containsFinalAnswer(
          result.feedback,
          input.final_answer,
          input.problem_text,
        )
      ) {
        console.log(`[validate] answer leak in feedback, retrying`);
        result = await callValidate(input);

        if (
          containsFinalAnswer(
            result.feedback,
            input.final_answer,
            input.problem_text,
          )
        ) {
          console.log(`[validate] answer leak on retry, using safe fallback`);
          result = {
            ...result,
            feedback:
              result.result === "partially_correct"
                ? SAFE_FEEDBACK_PARTIAL
                : SAFE_FEEDBACK_INCORRECT,
          };
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[validate] OK in ${elapsed}s, result=${result.result}, attempt=${input.attempt}`,
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    try {
      const result = await callValidate(input);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `[validate] OK (retry) in ${elapsed}s, result=${result.result}`,
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[validate] FAILED after ${elapsed}s`);
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `批改失敗：${msg}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
