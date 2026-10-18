const PET_KEY = "mathtutor_pet";
const PIN_KEY = "mathtutor_pin";
const SOLVE_LOG_KEY = "mathtutor_solvelog";

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

export function getTodayCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return getSolveLog().filter((e) => e.date === today).length;
}

export function getWeekCount(): number {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().slice(0, 10);
  return getSolveLog().filter((e) => e.date >= mondayStr).length;
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
