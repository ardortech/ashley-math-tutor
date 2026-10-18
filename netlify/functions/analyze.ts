import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requirePin } from "./lib/requirePin";
import { checkRateLimit } from "./lib/rateLimit";
import { CLAUDE_MODEL, TUTOR_SYSTEM_PROMPT, TEXTBOOK } from "./lib/config";

const ProblemItem = z.object({
  problem_latex: z.string(),
  problem_text: z.string(),
  topic: z.string(),
});

const AnalyzeResponse = z.object({
  problems: z.array(ProblemItem).min(1),
});

type AnalyzeResult = z.infer<typeof AnalyzeResponse>;

const ANALYZE_TASK = `你現在的任務是：看一張國中數學題目的照片，把題目轉成文字。

規則：
- 仔細辨認照片中的數學題目。
- 如果照片中有多題，把每一題分開列出。
- 每一題都要有：problem_latex（用 LaTeX 格式寫數學式）、problem_text（純文字描述）、topic（這題屬於哪個單元）。
- topic 請用${TEXTBOOK}版國一數學課本的單元名稱。
- 只做辨認和轉錄，不要解題、不要給提示、不要給答案。

請用以下 JSON 格式回覆（不要加任何其他文字）：
{
  "problems": [
    {
      "problem_latex": "解方程式 $3x + 5 = 14$",
      "problem_text": "解方程式 3x + 5 = 14",
      "topic": "一元一次方程式"
    }
  ]
}`;

async function callAnalyze(imageBase64: string): Promise<AnalyzeResult> {
  const client = new Anthropic();

  const mediaType = "image/jpeg";
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
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: ANALYZE_TASK },
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

  return AnalyzeResponse.parse(JSON.parse(jsonMatch[0]));
}

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pin = requirePin(request);
  if (!pin.ok) return pin.response!;

  const rl = await checkRateLimit(request);
  if (!rl.ok) return rl.response!;

  let imageBase64: string;
  try {
    const body = (await request.json()) as { image?: string };
    if (!body.image || typeof body.image !== "string") {
      return new Response(JSON.stringify({ error: "Missing image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    imageBase64 = body.image;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let result: AnalyzeResult;
  try {
    result = await callAnalyze(imageBase64);
  } catch (err) {
    try {
      result = await callAnalyze(imageBase64);
    } catch {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ error: `分析失敗：${msg}` }), {
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
