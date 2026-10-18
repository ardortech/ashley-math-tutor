const PET_KEY = "mathtutor_pet";
const PIN_KEY = "mathtutor_pin";
const SOLVE_LOG_KEY = "mathtutor_solvelog";
const DEVICE_ID_KEY = "mathtutor_device_id";
const PROGRESS_KEY = "mathtutor_progress";
const SCORED_KEY = "mathtutor_scored";
const PRACTICE_KEY = "mathtutor_practice";

export interface PetState {
  schemaVersion: 1;
  name: string;
  level: number;
  solvedCount: number;
  snacks: number;
  accessories: string[];
  equippedAccessories: string[];
}

export interface SolveEntry {
  date: string;
  topic: string;
  usedHints: boolean;
}

function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DEFAULT_PET: PetState = {
  schemaVersion: 1,
  name: "跳跳",
  level: 1,
  solvedCount: 0,
  snacks: 0,
  accessories: [],
  equippedAccessories: [],
};

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function getPetState(): PetState {
  return safeGet<PetState>(PET_KEY) ?? { ...DEFAULT_PET };
}

export function savePetState(state: PetState): void {
  safeSet(PET_KEY, state);
}

export function getSolveLog(): SolveEntry[] {
  return safeGet<SolveEntry[]>(SOLVE_LOG_KEY) ?? [];
}

export function saveSolveLog(log: SolveEntry[]): void {
  safeSet(SOLVE_LOG_KEY, log);
}

export function addSolveEntry(topic: string, usedHints: boolean): void {
  const log = getSolveLog();
  log.push({ date: localDateString(), topic, usedHints });
  saveSolveLog(log);
}

export function getTodayCount(): number {
  const today = localDateString();
  return getSolveLog().filter((e) => e.date === today).length;
}

export function getWeekCount(): number {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
  const mondayStr = localDateString(monday);
  return getSolveLog().filter((e) => e.date >= mondayStr).length;
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export function getPin(): string | null {
  try {
    return localStorage.getItem(PIN_KEY);
  } catch {
    return null;
  }
}

export function savePin(pin: string): void {
  try {
    localStorage.setItem(PIN_KEY, pin);
  } catch {
    // storage unavailable
  }
}

export function clearPin(): void {
  try {
    localStorage.removeItem(PIN_KEY);
  } catch {
    // storage unavailable
  }
}

export interface ChatMessage {
  role: "tutor" | "student";
  text: string;
}

export interface GuidedProgress {
  problemId: string;
  problem: { problem_latex: string; problem_text: string; topic: string };
  solve: {
    overview_hint: string;
    topic: string;
    final_answer: string;
    solution_steps: string[];
  };
  currentStep: number;
  hintLevel: number;
  messages: ChatMessage[];
  usedHints: boolean;
  attempt: number;
}

export function getProgress(): GuidedProgress | null {
  return safeGet<GuidedProgress>(PROGRESS_KEY);
}

export function saveProgress(progress: GuidedProgress): void {
  safeSet(PROGRESS_KEY, progress);
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // storage unavailable
  }
}

export function isScoredProblem(problemId: string): boolean {
  const scored = safeGet<string[]>(SCORED_KEY) ?? [];
  return scored.includes(problemId);
}

export function markProblemScored(problemId: string): void {
  const scored = safeGet<string[]>(SCORED_KEY) ?? [];
  if (!scored.includes(problemId)) {
    scored.push(problemId);
    safeSet(SCORED_KEY, scored);
  }
}

export interface VerifiedPracticeProblem {
  problem_text: string;
  problem_latex: string;
  final_answer: string;
  answer_prefix: string;
  solve: {
    overview_hint: string;
    topic: string;
    final_answer: string;
    solution_steps: string[];
  };
  problemId: string;
}

export interface PracticeProgress {
  originProblemText: string;
  topic: string;
  problems: VerifiedPracticeProblem[];
  currentIndex: number;
  attempts: number[];
  completed: boolean[];
}

export function getPracticeProgress(): PracticeProgress | null {
  return safeGet<PracticeProgress>(PRACTICE_KEY);
}

export function savePracticeProgress(progress: PracticeProgress): void {
  safeSet(PRACTICE_KEY, progress);
}

export function clearPracticeProgress(): void {
  try {
    localStorage.removeItem(PRACTICE_KEY);
  } catch {
    // storage unavailable
  }
}
