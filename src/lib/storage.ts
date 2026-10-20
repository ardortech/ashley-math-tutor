const PET_KEY = "mathtutor_pet";
const PIN_KEY = "mathtutor_pin";
const SOLVE_LOG_KEY = "mathtutor_solvelog";
const DEVICE_ID_KEY = "mathtutor_device_id";
const PROGRESS_KEY = "mathtutor_progress";
const SCORED_KEY = "mathtutor_scored";
const PRACTICE_KEY = "mathtutor_practice";
const TEXTBOOK_KEY = "mathtutor_textbook";

export interface PetState {
  schemaVersion: 1;
  name: string;
  solvedCount: number;
  snacks: number;
  accessories: string[];
  equippedAccessories: string[];
}

export type Subject = "math" | "chinese";

export interface SolveEntry {
  date: string;
  topic: string;
  usedHints: boolean;
  subject?: Subject;
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

export function addSolveEntry(topic: string, usedHints: boolean, subject: Subject = "math"): void {
  const log = getSolveLog();
  log.push({ date: localDateString(), topic, usedHints, subject });
  saveSolveLog(log);
}

function matchSubject(entry: SolveEntry, subject?: Subject): boolean {
  if (!subject) return true;
  return (entry.subject ?? "math") === subject;
}

export function getTodayCount(subject?: Subject): number {
  const today = localDateString();
  return getSolveLog().filter((e) => e.date === today && matchSubject(e, subject)).length;
}

export function getWeekCount(subject?: Subject): number {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
  const mondayStr = localDateString(monday);
  return getSolveLog().filter((e) => e.date >= mondayStr && matchSubject(e, subject)).length;
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

// ── Textbook setting ──

export type Textbook = "康軒" | "南一" | "翰林";

export function getTextbook(): Textbook {
  try {
    const val = localStorage.getItem(TEXTBOOK_KEY);
    if (val === "南一" || val === "翰林") return val;
  } catch { /* ignore */ }
  return "康軒";
}

export function saveTextbook(tb: Textbook): void {
  try {
    localStorage.setItem(TEXTBOOK_KEY, tb);
  } catch { /* ignore */ }
}

// ── Backup / Restore ──

export interface ChineseAnswerBackup {
  questionId: string;
  timesSeen: number;
  timesWrong: number;
  lastAnswer: number | string | null;
  lastSeen: string;
  lastCorrect: string | null;
}

export interface FavoriteBackup {
  id: string;
  subject: Subject;
  questionId: string;
  savedAt: string;
}

export interface BackupPayload {
  schemaVersion: 1 | 2 | 3;
  pet: PetState;
  solveLog: SolveEntry[];
  scoredProblemIds: string[];
  textbook: Textbook;
  exportedAt: string;
  chineseAnswers?: ChineseAnswerBackup[];
  favorites?: FavoriteBackup[];
}

export async function createBackupAsync(): Promise<BackupPayload> {
  const [chineseAnswers, favorites] = await Promise.all([
    import("./chinese/answerRecord").then((m) => m.getAllRecords()),
    import("./favorites").then((m) => m.getAllFavorites()),
  ]);
  return {
    schemaVersion: 3,
    pet: getPetState(),
    solveLog: getSolveLog(),
    scoredProblemIds: safeGet<string[]>(SCORED_KEY) ?? [],
    textbook: getTextbook(),
    exportedAt: new Date().toISOString(),
    chineseAnswers,
    favorites,
  };
}

export function createBackup(): BackupPayload {
  return {
    schemaVersion: 3,
    pet: getPetState(),
    solveLog: getSolveLog(),
    scoredProblemIds: safeGet<string[]>(SCORED_KEY) ?? [],
    textbook: getTextbook(),
    exportedAt: new Date().toISOString(),
    chineseAnswers: [],
    favorites: [],
  };
}

function migrateSolveLog(log: SolveEntry[]): SolveEntry[] {
  return log.map((e) => (e.subject ? e : { ...e, subject: "math" as Subject }));
}

export async function restoreBackupAsync(data: BackupPayload): Promise<void> {
  savePetState(data.pet);
  saveSolveLog(
    data.schemaVersion === 1 ? migrateSolveLog(data.solveLog) : data.solveLog,
  );
  safeSet(SCORED_KEY, data.scoredProblemIds);
  saveTextbook(data.textbook);

  if (data.chineseAnswers && data.chineseAnswers.length > 0) {
    const { importRecords } = await import("./chinese/answerRecord");
    await importRecords(data.chineseAnswers);
  }
  if (data.favorites && data.favorites.length > 0) {
    const { importFavorites } = await import("./favorites");
    await importFavorites(data.favorites);
  }
}

export function restoreBackup(data: BackupPayload): void {
  savePetState(data.pet);
  saveSolveLog(
    data.schemaVersion === 1 ? migrateSolveLog(data.solveLog) : data.solveLog,
  );
  safeSet(SCORED_KEY, data.scoredProblemIds);
  saveTextbook(data.textbook);
  void restoreBackupAsync(data);
}
