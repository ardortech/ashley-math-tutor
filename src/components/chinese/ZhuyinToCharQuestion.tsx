import { useState, useEffect, useCallback, useRef } from "react";
import HandwritingInput from "./HandwritingInput";
import PracticeCanvas from "./PracticeCanvas";
import PencilIcon from "../icons/PencilIcon";
import StarIcon from "../icons/StarIcon";
import TiaoTiaoHeadHappy from "../pet/TiaoTiaoHeadHappy";
import TiaoTiaoHeadCurious from "../pet/TiaoTiaoHeadCurious";
import type { ZhuyinToChar } from "../../lib/chinese/schema";
import { answersMatch } from "../../lib/chinese/normalizeAnswer";

interface Props {
  question: ZhuyinToChar;
  showUnverifiedBadge: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

const ZHUYIN_PAREN = /（([^）]+)）/g;

interface SentencePart {
  type: "text" | "blank";
  content: string;
}

function parseSentence(sentence: string): SentencePart[] {
  const parts: SentencePart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(ZHUYIN_PAREN.source, "g");

  while ((match = re.exec(sentence)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: sentence.slice(lastIndex, match.index) });
    }
    parts.push({ type: "blank", content: match[1]! });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < sentence.length) {
    parts.push({ type: "text", content: sentence.slice(lastIndex) });
  }
  return parts;
}

export default function ZhuyinToCharQuestion({
  question,
  showUnverifiedBadge,
  isFavorited,
  onToggleFavorite,
  onAnswer,
  onNext,
}: Props) {
  const answerLength = [...question.answer].length;
  const [chars, setChars] = useState<string[]>(() => Array(answerLength).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [showNod, setShowNod] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setChars(Array(answerLength).fill(""));
    setSubmitted(false);
    setIsCorrect(false);
    setGaveUp(false);
    setShowPractice(false);
    setShowNod(false);
    inputRefs.current = Array(answerLength).fill(null);
  }, [question.id, answerLength]);

  const parts = parseSentence(question.sentence);

  const handleCharChange = useCallback(
    (i: number, ch: string) => {
      const next = [...chars];
      next[i] = ch;
      setChars(next);

      if (ch && i < answerLength - 1) {
        setTimeout(() => inputRefs.current[i + 1]?.focus(), 50);
      }
    },
    [chars, answerLength],
  );

  const combined = chars.join("");
  const allFilled = [...combined].filter((c) => /\p{Script=Han}/u.test(c)).length === answerLength;

  const handleSubmit = useCallback(() => {
    if (!allFilled) return;
    const correct = answersMatch(combined, question.answer);
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(combined, correct);
    if (correct) {
      setShowNod(true);
      setTimeout(() => setShowNod(false), 800);
    }
  }, [allFilled, combined, question.answer, onAnswer]);

  const handleGiveUp = useCallback(() => {
    setGaveUp(true);
    setSubmitted(true);
    onAnswer("gave_up", false);
  }, [onAnswer]);

  const done = submitted;

  return (
    <div className="flex flex-col h-full">
      {/* Badge */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-muted">注音寫國字</span>
        {showUnverifiedBadge && !question.verified && (
          <span className="text-[10px] rounded-full bg-pet-soft text-pet px-2 py-0.5 font-medium">
            未審核
          </span>
        )}
      </div>

      {/* Sentence with blanks */}
      <div className="rounded-2xl border border-card-border bg-card p-4 mb-4">
        <p className="text-base text-muted mb-3">把注音的部分寫成國字</p>
        <div className="flex flex-wrap items-baseline gap-0.5"
          style={{ fontSize: 28, fontFamily: "'PMingLiU', 'Noto Serif TC', serif", lineHeight: 1.8 }}
        >
          {parts.map((part, i) =>
            part.type === "text" ? (
              <span key={i} className="text-ink">{part.content}</span>
            ) : (
              <span
                key={i}
                className="inline-flex items-center rounded-lg bg-primary-soft px-2 py-0.5 text-primary font-bold mx-0.5"
                style={{ fontSize: 22 }}
              >
                {part.content}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Writing area */}
      {!done && (
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-ink">
            用 Apple Pencil 把正確的字寫在格子裡
          </p>

          <div className="flex items-center gap-4 justify-center">
            {Array.from({ length: answerLength }, (_, i) => (
              <div key={i}>
                <HandwritingInput
                  value={chars[i] ?? ""}
                  onChange={(ch) => handleCharChange(i, ch)}
                  size={Math.min(180, answerLength > 1 ? 140 : 180)}
                  autoFocus={i === 0}
                  inputRef={{ current: inputRefs.current[i] } as React.RefObject<HTMLInputElement | null>}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className="rounded-2xl bg-primary px-8 py-3 text-base font-bold text-white
                shadow-[0_6px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
                transition-all disabled:opacity-40"
            >
              送出
            </button>
            <button
              onClick={handleGiveUp}
              className="text-sm text-muted underline underline-offset-2"
            >
              我不知道
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {done && (
        <>
          <div className="rounded-2xl border border-card-border bg-card p-4 mb-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="shrink-0" style={{ width: 36, height: 36 }}>
                {isCorrect ? (
                  <TiaoTiaoHeadHappy className={`w-full h-full ${showNod ? "pet-nod" : ""}`} />
                ) : (
                  <TiaoTiaoHeadCurious className="w-full h-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isCorrect && !gaveUp && (
                  <p className="text-sm font-bold text-success mb-1">答對了！</p>
                )}
                {!isCorrect && !gaveUp && (
                  <>
                    <p className="text-sm font-bold text-fix mb-1">再想想看喔</p>
                    <p className="text-sm text-ink mb-1">
                      正確答案是「<span className="font-bold text-success">{question.answer}</span>」
                    </p>
                  </>
                )}
                {gaveUp && (
                  <>
                    <p className="text-sm font-bold text-muted mb-1">沒關係，看看答案吧</p>
                    <p className="text-sm text-ink mb-1">
                      正確答案是「<span className="font-bold text-success">{question.answer}</span>」
                    </p>
                  </>
                )}
                <p className="text-sm text-ink leading-relaxed mt-1">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Practice canvas for wrong answers */}
          {!isCorrect && !showPractice && (
            <button
              onClick={() => setShowPractice(true)}
              className="w-full rounded-2xl border border-card-border bg-card p-3 text-sm font-medium text-primary
                active:bg-primary-soft transition-colors mb-4"
            >
              <span className="inline-flex items-center gap-1.5"><PencilIcon className="w-4 h-4" /> 用筆練寫一次「{question.answer}」</span>
            </button>
          )}
          {showPractice && (
            <div className="mb-4 animate-fade-in">
              <PracticeCanvas
                char={question.answer}
                onDone={() => setShowPractice(false)}
              />
            </div>
          )}

          {/* Bottom buttons */}
          <div className="mt-auto pt-2 flex gap-3">
            <button
              onClick={onToggleFavorite}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors
                ${isFavorited
                  ? "border-pet bg-pet-soft text-pet"
                  : "border-card-border bg-card text-muted"
                }`}
              aria-label={isFavorited ? "取消收藏" : "收藏這題"}
            >
              <StarIcon filled={isFavorited} className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              className="flex-1 rounded-2xl bg-primary px-6 py-3 text-base font-bold text-white
                shadow-[0_6px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              下一題 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
