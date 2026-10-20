import { useState, useEffect, useCallback } from "react";
import HandwritingInput from "./HandwritingInput";
import PracticeCanvas from "./PracticeCanvas";
import TiaoTiaoHeadHappy from "../pet/TiaoTiaoHeadHappy";
import TiaoTiaoHeadCurious from "../pet/TiaoTiaoHeadCurious";
import type { FixChar } from "../../lib/chinese/schema";
import { answersMatch } from "../../lib/chinese/normalizeAnswer";

interface Props {
  question: FixChar;
  showUnverifiedBadge: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  onNext: () => void;
}

type Phase = "pick" | "write" | "result";

const PUNCTUATION = /[　-〿＀-｠ -⁯⸀-⹿.,;:!?。，；：！？、「」『』（）《》〈〉【】…—─～·]/;

function splitSentence(sentence: string): { char: string; isPunct: boolean }[] {
  return [...sentence].map((ch) => ({
    char: ch,
    isPunct: PUNCTUATION.test(ch) || ch === " " || ch === "　",
  }));
}

export default function FixCharQuestion({
  question,
  showUnverifiedBadge,
  isFavorited,
  onToggleFavorite,
  onAnswer,
  onNext,
}: Props) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [writtenChar, setWrittenChar] = useState("");
  const [result, setResult] = useState<"correct" | "wrong_pick" | "wrong_write" | "gave_up" | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [showNod, setShowNod] = useState(false);

  useEffect(() => {
    setPhase("pick");
    setSelectedChar(null);
    setSelectedIndex(null);
    setWrittenChar("");
    setResult(null);
    setShowPractice(false);
    setShowNod(false);
  }, [question.id]);

  const chars = splitSentence(question.sentence);

  const handleCharClick = useCallback(
    (ch: string, idx: number) => {
      if (phase !== "pick") return;
      setSelectedChar(ch);
      setSelectedIndex(idx);
    },
    [phase],
  );

  const handleConfirmPick = useCallback(() => {
    if (!selectedChar) return;
    if (selectedChar !== question.wrong_char) {
      setResult("wrong_pick");
      setPhase("result");
      onAnswer(`pick:${selectedChar}`, false);
      return;
    }
    setPhase("write");
  }, [selectedChar, question.wrong_char, onAnswer]);

  const handleSubmitWrite = useCallback(() => {
    if (!writtenChar.trim()) return;
    const correct = answersMatch(writtenChar, question.correct_char);
    if (correct) {
      setResult("correct");
      setShowNod(true);
      setTimeout(() => setShowNod(false), 800);
    } else {
      setResult("wrong_write");
    }
    setPhase("result");
    onAnswer(`${selectedChar}→${writtenChar}`, correct);
  }, [writtenChar, question.correct_char, selectedChar, onAnswer]);

  const handleGiveUp = useCallback(() => {
    setResult("gave_up");
    setPhase("result");
    onAnswer("gave_up", false);
  }, [onAnswer]);

  const isCorrect = result === "correct";
  const wrongCharIndex = chars.findIndex((c) => c.char === question.wrong_char);

  return (
    <div className="flex flex-col h-full">
      {/* Badge */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-muted">改錯字</span>
        {showUnverifiedBadge && !question.verified && (
          <span className="text-[10px] rounded-full bg-pet-soft text-pet px-2 py-0.5 font-medium">
            未審核
          </span>
        )}
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-card-border bg-card p-4 mb-4">
        <p className="text-base text-muted mb-2">找出句子中的錯字，並寫出正確的字</p>
        <p className="text-sm text-muted">
          成語：<span className="font-bold text-ink">{question.word}</span>
        </p>
      </div>

      {/* Character grid */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-4 px-1">
        {chars.map(({ char, isPunct }, i) => {
          if (isPunct) {
            return (
              <div
                key={i}
                className="flex items-center justify-center text-ink"
                style={{
                  width: 40,
                  height: 76,
                  fontSize: 28,
                  fontFamily: "'PMingLiU', 'Noto Serif TC', serif",
                }}
              >
                {char}
              </div>
            );
          }

          let borderClass = "border-card-border";
          let bgClass = "bg-card";
          if (phase === "result" && i === wrongCharIndex) {
            borderClass = "border-fix";
            bgClass = "bg-fix-soft";
          } else if (selectedIndex === i) {
            borderClass = "border-fix";
            bgClass = "bg-fix-soft";
          }

          const clickable = phase === "pick";

          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => handleCharClick(char, i)}
              className={`flex items-center justify-center rounded-xl border-2
                transition-all
                ${borderClass} ${bgClass}
                ${clickable ? "active:scale-95 hover:border-fix/60" : ""}
                ${!clickable ? "cursor-default" : ""}`}
              style={{
                width: 64,
                height: 76,
                fontSize: 40,
                fontFamily: "'PMingLiU', 'Noto Serif TC', serif",
              }}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Phase: pick */}
      {phase === "pick" && (
        <div className="space-y-3">
          {selectedChar && (
            <div className="text-center">
              <p className="text-sm text-muted mb-2">
                你選的是「<span className="font-bold text-fix">{selectedChar}</span>」
              </p>
              <button
                onClick={handleConfirmPick}
                className="rounded-2xl bg-primary px-8 py-3 text-base font-bold text-white
                  shadow-[0_6px_0_0_var(--color-primary-pressed)]
                  active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
                  transition-all"
              >
                確定是這個字
              </button>
            </div>
          )}
          <div className="text-center">
            <button
              onClick={handleGiveUp}
              className="text-sm text-muted underline underline-offset-2"
            >
              我不知道
            </button>
          </div>
        </div>
      )}

      {/* Phase: write */}
      {phase === "write" && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted mb-1">
              你找到了「<span className="font-bold text-fix">{selectedChar}</span>」是錯字
            </p>
            <p className="text-base font-bold text-ink mb-3">
              用 Apple Pencil 把正確的字寫在格子裡
            </p>
          </div>

          <div className="flex justify-center">
            <HandwritingInput
              value={writtenChar}
              onChange={setWrittenChar}
              size={180}
              autoFocus
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleSubmitWrite}
              disabled={!writtenChar.trim()}
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

      {/* Phase: result */}
      {phase === "result" && result && (
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
                {result === "correct" && (
                  <p className="text-sm font-bold text-success mb-1">答對了！</p>
                )}
                {result === "wrong_pick" && (
                  <>
                    <p className="text-sm font-bold text-fix mb-1">錯字不是這個喔</p>
                    <p className="text-sm text-ink mb-1">
                      錯字是「<span className="font-bold text-fix">{question.wrong_char}</span>」，
                      正確的字是「<span className="font-bold text-success">{question.correct_char}</span>」
                    </p>
                  </>
                )}
                {result === "wrong_write" && (
                  <>
                    <p className="text-sm font-bold text-fix mb-1">你找對了錯字，但正確的字不太對</p>
                    <p className="text-sm text-ink mb-1">
                      正確的字是「<span className="font-bold text-success">{question.correct_char}</span>」
                    </p>
                  </>
                )}
                {result === "gave_up" && (
                  <>
                    <p className="text-sm font-bold text-muted mb-1">沒關係，看看答案吧</p>
                    <p className="text-sm text-ink mb-1">
                      錯字是「<span className="font-bold text-fix">{question.wrong_char}</span>」→
                      正確的字是「<span className="font-bold text-success">{question.correct_char}</span>」
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
              ✏️ 用筆練寫一次「{question.correct_char}」
            </button>
          )}
          {showPractice && (
            <div className="mb-4 animate-fade-in">
              <PracticeCanvas
                char={question.correct_char}
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
            >
              {isFavorited ? "★" : "☆"}
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
