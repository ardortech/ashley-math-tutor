import {
  QuestionBankFileSchema,
  type Question,
  type ChoiceQuestion,
  type WritingQuestion,
  CHOICE_TYPES,
  WRITING_TYPES,
  ALL_QUESTION_TYPES,
  type ChoiceType,
  type QuestionType,
  QUESTION_TYPE_LABELS,
} from "./schema";

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
  type?: QuestionType;
}

export function getChoiceQuestions(filter: QuestionFilter = {}): ChoiceQuestion[] {
  const all = getAll();
  return all.filter((q): q is ChoiceQuestion => {
    if (!filter.includeUnverified && !q.verified) return false;
    if (filter.type) return q.type === filter.type;
    return (CHOICE_TYPES as readonly string[]).includes(q.type);
  });
}

export function getWritingQuestions(filter: QuestionFilter = {}): WritingQuestion[] {
  const all = getAll();
  return all.filter((q): q is WritingQuestion => {
    if (!filter.includeUnverified && !q.verified) return false;
    if (filter.type) return q.type === filter.type;
    return (WRITING_TYPES as readonly string[]).includes(q.type);
  });
}

export function getAllQuestions(filter: QuestionFilter = {}): Question[] {
  const all = getAll();
  return all.filter((q) => {
    if (!filter.includeUnverified && !q.verified) return false;
    if (filter.type) return q.type === filter.type;
    return (ALL_QUESTION_TYPES as readonly string[]).includes(q.type);
  });
}

export function getQuestionById(id: string): Question | undefined {
  return getAll().find((q) => q.id === id);
}

export function getTypeStats(includeUnverified: boolean): Record<QuestionType, { total: number; label: string }> {
  const questions = getAllQuestions({ includeUnverified });
  const result = {} as Record<QuestionType, { total: number; label: string }>;
  for (const t of ALL_QUESTION_TYPES) {
    result[t] = {
      total: questions.filter((q) => q.type === t).length,
      label: QUESTION_TYPE_LABELS[t],
    };
  }
  return result;
}

export function getChoiceTypeStats(includeUnverified: boolean): Record<ChoiceType, { total: number; label: string }> {
  const full = getTypeStats(includeUnverified);
  return {
    reading_choice: full.reading_choice,
    meaning_choice: full.meaning_choice,
  };
}
