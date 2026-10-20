import { QuestionBankFileSchema, type Question, type ChoiceQuestion, CHOICE_TYPES, type ChoiceType } from "./schema";

const bankModules = import.meta.glob<{ default: unknown }>(
  "/content/chinese/*.json",
  { eager: true },
);

function loadAndValidate(): Question[] {
  const allQuestions: Question[] = [];
  const seenIds = new Set<string>();

  for (const [path, mod] of Object.entries(bankModules)) {
    const parsed = QuestionBankFileSchema.parse(mod.default);
    for (const q of parsed.questions) {
      if (seenIds.has(q.id)) {
        throw new Error(`Duplicate question id "${q.id}" in ${path}`);
      }
      seenIds.add(q.id);
      allQuestions.push(q);
    }
  }

  return allQuestions;
}

let _cache: Question[] | null = null;

function getAll(): Question[] {
  if (!_cache) {
    _cache = loadAndValidate();
  }
  return _cache;
}

export interface QuestionFilter {
  includeUnverified?: boolean;
  type?: ChoiceType;
}

export function getChoiceQuestions(filter: QuestionFilter = {}): ChoiceQuestion[] {
  const all = getAll();
  return all.filter((q): q is ChoiceQuestion => {
    if (!filter.includeUnverified && !q.verified) return false;
    if (filter.type) return q.type === filter.type;
    return (CHOICE_TYPES as readonly string[]).includes(q.type);
  });
}

export function getQuestionById(id: string): Question | undefined {
  return getAll().find((q) => q.id === id);
}

export function getChoiceTypeStats(includeUnverified: boolean): Record<ChoiceType, { total: number; label: string }> {
  const questions = getChoiceQuestions({ includeUnverified });
  const rc = questions.filter((q) => q.type === "reading_choice").length;
  const mc = questions.filter((q) => q.type === "meaning_choice").length;
  return {
    reading_choice: { total: rc, label: "字音" },
    meaning_choice: { total: mc, label: "字義" },
  };
}
