import { z } from "zod";

const BaseQuestion = z.object({
  id: z.string().min(1),
  lesson: z.union([z.string(), z.null()]),
  explanation: z.string(),
  source: z.string(),
  verified: z.boolean(),
});

export const ReadingChoiceSchema = BaseQuestion.extend({
  type: z.literal("reading_choice"),
  context: z.string(),
  target: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.number().int().min(0).max(3),
  trap: z.string().optional(),
  review_note: z.string().optional(),
});

export const MeaningChoiceSchema = BaseQuestion.extend({
  type: z.literal("meaning_choice"),
  context: z.string(),
  target: z.string(),
  options: z.array(z.string()).length(4),
  answer: z.number().int().min(0).max(3),
  trap: z.string().optional(),
});

export const FixCharSchema = BaseQuestion.extend({
  type: z.literal("fix_char"),
  sentence: z.string(),
  wrong_char: z.string(),
  correct_char: z.string(),
  word: z.string(),
});

export const ZhuyinToCharSchema = BaseQuestion.extend({
  type: z.literal("zhuyin_to_char"),
  sentence: z.string(),
  answer: z.string(),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  ReadingChoiceSchema,
  MeaningChoiceSchema,
  FixCharSchema,
  ZhuyinToCharSchema,
]);

export const QuestionBankFileSchema = z.object({
  bank: z.string(),
  description: z.string(),
  textbook: z.union([z.string(), z.null()]),
  questions: z.array(QuestionSchema),
});

export type Question = z.infer<typeof QuestionSchema>;
export type ReadingChoice = z.infer<typeof ReadingChoiceSchema>;
export type MeaningChoice = z.infer<typeof MeaningChoiceSchema>;
export type FixChar = z.infer<typeof FixCharSchema>;
export type ZhuyinToChar = z.infer<typeof ZhuyinToCharSchema>;
export type QuestionBankFile = z.infer<typeof QuestionBankFileSchema>;

export type ChoiceQuestion = ReadingChoice | MeaningChoice;
export type WritingQuestion = FixChar | ZhuyinToChar;

export const CHOICE_TYPES = ["reading_choice", "meaning_choice"] as const;
export type ChoiceType = (typeof CHOICE_TYPES)[number];

export const WRITING_TYPES = ["fix_char", "zhuyin_to_char"] as const;
export type WritingType = (typeof WRITING_TYPES)[number];

export const ALL_QUESTION_TYPES = [...CHOICE_TYPES, ...WRITING_TYPES] as const;
export type QuestionType = (typeof ALL_QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  reading_choice: "字音",
  meaning_choice: "字義",
  fix_char: "改錯字",
  zhuyin_to_char: "注音寫國字",
};
