import type { Question, QuestionType } from "./schema";
import { getAllQuestions } from "./questionBank";
import { getAllRecords, type AnswerRecord } from "./answerRecord";

const SESSION_KEY = "mathtutor_chinese_daily";
const ADMIN_KEY = "mathtutor_chinese_admin";
const SESSION_COUNT = 10;

function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface DailySession {
  date: string;
  questionIds: string[];
  answers: (number | string | null)[];
  correct: (boolean | null)[];
  currentIndex: number;
  completed: boolean;
  filterType?: QuestionType;
}

export function getAdminMode(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAdminMode(on: boolean): void {
  try {
    localStorage.setItem(ADMIN_KEY, on ? "true" : "false");
  } catch { /* ignore */ }
}

export function isAdminUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("admin") === "1";
  } catch {
    return false;
  }
}

export function getDailySession(): DailySession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailySession;
  } catch {
    return null;
  }
}

export function saveDailySession(session: DailySession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore */ }
}

export function clearDailySession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export async function buildDailySession(filterType?: QuestionType): Promise<DailySession> {
  const includeUnverified = getAdminMode();
  const available = getAllQuestions({ includeUnverified, type: filterType });
  const records = await getAllRecords();
  const recordMap = new Map<string, AnswerRecord>();
  for (const r of records) {
    recordMap.set(r.questionId, r);
  }

  const wrong: Question[] = [];
  const unseen: Question[] = [];
  const seen: Question[] = [];

  for (const q of available) {
    const rec = recordMap.get(q.id);
    if (!rec) {
      unseen.push(q);
    } else if (rec.timesWrong > 0 && rec.lastCorrect !== rec.lastSeen) {
      wrong.push(q);
    } else {
      seen.push(q);
    }
  }

  const sorted = [
    ...shuffle(wrong),
    ...shuffle(unseen),
    ...shuffle(seen),
  ];

  const picked = sorted.slice(0, SESSION_COUNT);

  return {
    date: localDateString(),
    questionIds: picked.map((q) => q.id),
    answers: picked.map(() => null),
    correct: picked.map(() => null),
    currentIndex: 0,
    completed: false,
    filterType,
  };
}

export function getTodaySessionProgress(): { done: number; total: number; completed: boolean } {
  const session = getDailySession();
  if (!session || session.date !== localDateString()) {
    return { done: 0, total: SESSION_COUNT, completed: false };
  }
  const done = session.answers.filter((a) => a !== null).length;
  return { done, total: session.questionIds.length, completed: session.completed };
}
