import { getPin, clearPin, getDeviceId } from "./storage";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const pin = getPin();
  const headers = new Headers(options.headers);
  if (pin) {
    headers.set("x-app-pin", pin);
  }
  headers.set("x-device-id", getDeviceId());

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    clearPin();
    window.location.href = "/pin";
    throw new ApiError(401, "PIN 驗證失敗");
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new ApiError(429, body.error ?? "今天問好多題了，休息一下再來！");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res;
}

export interface AnalyzeProblem {
  problem_latex: string;
  problem_text: string;
  topic: string;
}

export interface AnalyzeResult {
  problems: AnalyzeProblem[];
}

export interface SolveResult {
  overview_hint: string;
  topic: string;
  final_answer: string;
  solution_steps: string[];
}

export interface HintResult {
  message: string;
}

export interface HintRequest {
  problem_text: string;
  solution_steps: string[];
  step_index: number;
  hint_level: 1 | 2 | 3;
  final_answer: string;
  student_thought?: string;
  recent_messages?: { role: "tutor" | "student"; text: string }[];
}

export async function analyzeImage(imageBase64: string): Promise<AnalyzeResult> {
  const res = await apiFetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });
  return res.json() as Promise<AnalyzeResult>;
}

export async function solveProblem(problemText: string): Promise<SolveResult> {
  const res = await apiFetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problem_text: problemText }),
  });
  return res.json() as Promise<SolveResult>;
}

export async function requestHint(req: HintRequest): Promise<HintResult> {
  const res = await apiFetch("/api/hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json() as Promise<HintResult>;
}
