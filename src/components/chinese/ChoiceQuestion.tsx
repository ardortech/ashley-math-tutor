import { useState, useEffect } from "react";
import TiaoTiaoHeadHappy from "../pet/TiaoTiaoHeadHappy";
import type { ChoiceQuestion as ChoiceQ } from "../../lib/chinese/schema";

interface Props {
  question: ChoiceQ;
  showUnverifiedBadge: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
}

function HighlightTarget({ text, target }: { text: string; target: string }) {
  const idx = text.indexOf(target);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="underline decoration-2 underline-offset-4 decoration-primary font-bold">
        {target}
      </span>
      {text.slice(idx + target.length)}
    </>
  );
}

export default function ChoiceQuestionUI({
  question,
  showUnverifiedBadge,
  isFavorited,
  onToggleFavorite,
  onAnswer,
  onNext,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showNod, setShowNod] = useState(false);
  const answered = selected !== null;
  const isCorrect = selected === question.answer;

  useEffect(() => {
    setSelected(null);
    setShowNod(false);
  }, [question.id]);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    const correct = idx === question.answer;
    onAnswer(idx, correct);
    if (correct) {
      setShowNod(true);
      setTimeout(() => setShowNod(false), 800);
    }
  };

  const isReadingChoice = question.type === "reading_choice";

  return (
    <div className="flex flex-col h-full">
      {/* Badge row */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs text-muted">
          {isReadingChoice ? "字音" : "字義"}
        </span>
        {showUnverifiedBadge && !question.verified && (
          <span className="text-[10px] rounded-full bg-pet-soft text-pet px-2 py-0.5 font-medium">
            未審核
          </span>
        )}
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-card-border bg-card p-4 mb-4">
        {isReadingChoice ? (
          <>
            <p className="text-xl leading-relaxed text-ink" style={{ fontFamily: "serif, 'Noto Serif TC', 'PMingLiU'" }}>
              <HighlightTarget
                text={question.context.replace(/「|」/g, "")}
                target={question.target}
              />
            </p>
            <p className="text-base text-muted mt-2">
              「<span className="font-bold text-ink">{question.target}</span>」的讀音是？
            </p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-ink mb-1">
              <HighlightTarget text={question.context} target={question.target} />
            </p>
            <p className="text-base text-muted mt-2">
              「<span className="font-bold text-ink">{question.target}</span>」是什麼意思？
            </p>
          </>
        )}
      </div>

      {/* 2x2 Options grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {question.options.map((opt, i) => {
          let style = "border-card-border bg-card text-ink";
          let badge: React.ReactNode = null;

          if (answered) {
            if (i === question.answer) {
              style = "border-success bg-success-soft text-success";
              badge = (
                <span className="text-[11px] font-bold text-success">正確</span>
              );
            } else if (i === selected) {
              style = "border-fix bg-fix-soft text-fix";
              badge = (
                <span className="text-[11px] font-bold text-fix">你選的</span>
              );
            } else {
              style = "border-card-border bg-card text-muted opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`relative rounded-2xl border-2 p-4 flex items-center justify-center transition-all
                ${style}
                ${!answered ? "active:scale-95 hover:border-primary/50" : ""}`}
              style={{ minHeight: 84 }}
            >
              {badge && (
                <span className="absolute top-2 right-2">{badge}</span>
              )}
              <span className={`text-center leading-relaxed ${isReadingChoice ? "text-2xl" : "text-lg"} font-medium`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation after answer */}
      {answered && (
        <div className="rounded-2xl border border-card-border bg-card p-4 mb-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="shrink-0 relative" style={{ width: 36, height: 36 }}>
              <TiaoTiaoHeadHappy className={`w-full h-full ${showNod ? "pet-nod" : ""}`} />
            </div>
            <div className="flex-1 min-w-0">
              {isCorrect ? (
                <p className="text-sm font-bold text-success mb-1">答對了！</p>
              ) : (
                <p className="text-sm font-bold text-fix mb-1">再想想看喔</p>
              )}
              <p className="text-sm text-ink leading-relaxed">
                {question.explanation}
              </p>
              {"trap" in question && question.trap && (
                <span className="inline-block mt-2 text-[11px] rounded-full bg-pet-soft text-pet px-2.5 py-0.5 font-medium">
                  小心{question.trap}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      {answered && (
        <div className="mt-auto pt-2 flex gap-3">
          <button
            onClick={onToggleFavorite}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors
              ${isFavorited
                ? "border-pet bg-pet-soft text-pet"
                : "border-card-border bg-card text-muted"
              }`}
            aria-label={isFavorited ? "取消收藏" : "加入收藏"}
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
      )}
    </div>
  );
}
