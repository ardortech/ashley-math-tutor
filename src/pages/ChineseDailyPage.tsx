import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChoiceQuestionUI from "../components/chinese/ChoiceQuestion";
import FixCharQuestionUI from "../components/chinese/FixCharQuestion";
import ZhuyinToCharQuestionUI from "../components/chinese/ZhuyinToCharQuestion";
import CelebrationScreen from "../components/CelebrationScreen";
import { getQuestionById } from "../lib/chinese/questionBank";
import { recordAnswer } from "../lib/chinese/answerRecord";
import { toggleFavorite, isFavorite } from "../lib/favorites";
import {
  getDailySession,
  saveDailySession,
  clearDailySession,
  buildDailySession,
  getAdminMode,
  type DailySession,
} from "../lib/chinese/dailySession";
import { recordSolve, type ScoreResult } from "../lib/scoring";
import type { ChoiceQuestion, FixChar, ZhuyinToChar, QuestionType } from "../lib/chinese/schema";

function localDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ChineseDailyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("type") as QuestionType | null;

  const [session, setSession] = useState<DailySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    const existing = getDailySession();
    if (
      existing &&
      existing.date === localDateString() &&
      !existing.completed &&
      (filterType ?? undefined) === existing.filterType
    ) {
      setSession(existing);
      const qId = existing.questionIds[existing.currentIndex];
      if (qId) {
        const fav = await isFavorite("chinese", qId);
        setFavorited(fav);
      }
    } else {
      const newSession = await buildDailySession(filterType ?? undefined);
      saveDailySession(newSession);
      setSession(newSession);
      const qId = newSession.questionIds[0];
      if (qId) {
        const fav = await isFavorite("chinese", qId);
        setFavorited(fav);
      }
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  if (loading || !session) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">正在準備題目…</p>
      </div>
    );
  }

  const currentQId = session.questionIds[session.currentIndex];
  const question = currentQId ? getQuestionById(currentQId) : undefined;
  const includeUnverified = getAdminMode();
  const total = session.questionIds.length;
  const answeredCount = session.answers.filter((a) => a !== null).length;
  const correctCount = session.correct.filter((c) => c === true).length;

  if (session.completed && scoreResult) {
    return (
      <CelebrationScreen
        feedback={`完成今天的國文練習！答對 ${correctCount} / ${total} 題`}
        snacksEarned={scoreResult.snacksEarned}
        solvedCount={scoreResult.newSolvedCount}
        equippedAccessories={scoreResult.equippedAccessories}
        prevLevel={scoreResult.prevLevel}
        newLevel={scoreResult.newLevel}
        newAccessories={scoreResult.newAccessories}
        buttons={
          <>
            <button
              onClick={() => {
                clearDailySession();
                navigate("/chinese");
              }}
              className="w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              回國文首頁
            </button>
            <button
              onClick={async () => {
                clearDailySession();
                setScoreResult(null);
                setLoading(true);
                const newSession = await buildDailySession(filterType ?? undefined);
                saveDailySession(newSession);
                setSession(newSession);
                const qId = newSession.questionIds[0];
                if (qId) {
                  const fav = await isFavorite("chinese", qId);
                  setFavorited(fav);
                }
                setLoading(false);
              }}
              className="w-full rounded-2xl border border-card-border bg-card px-6 py-4 text-lg font-bold text-ink
                active:bg-card-border/30 transition-colors"
            >
              再練 10 題
            </button>
          </>
        }
      />
    );
  }

  if (!question) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">沒有可用的題目</p>
      </div>
    );
  }

  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  const handleAnswer = async (answer: number | string, isCorrect: boolean) => {
    const updated: DailySession = {
      ...session,
      answers: session.answers.map((a, i) =>
        i === session.currentIndex ? answer : a,
      ),
      correct: session.correct.map((c, i) =>
        i === session.currentIndex ? isCorrect : c,
      ),
    };
    setSession(updated);
    saveDailySession(updated);

    await recordAnswer(question.id, isCorrect, answer, localDateString());
  };

  const handleNext = async () => {
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= total) {
      const finalCorrectCount = session.correct.filter((c) => c === true).length;
      const allCorrect = finalCorrectCount === total;
      const snackAmount = allCorrect ? 2 : 1;

      const sessionId = `chinese-daily-${session.date}-${Date.now()}`;
      const result = recordSolve({
        subject: "chinese",
        problemId: sessionId,
        topic: session.filterType ? `國文-${session.filterType}` : "國文-每日練習",
        usedHints: false,
        snackAmount,
      });

      const completed: DailySession = { ...session, completed: true, currentIndex: nextIndex };
      setSession(completed);
      saveDailySession(completed);
      setScoreResult(result);
    } else {
      const updated: DailySession = { ...session, currentIndex: nextIndex };
      setSession(updated);
      saveDailySession(updated);

      const nextQId = session.questionIds[nextIndex];
      if (nextQId) {
        const fav = await isFavorite("chinese", nextQId);
        setFavorited(fav);
      }
    }
  };

  const handleToggleFavorite = async () => {
    const nowFav = await toggleFavorite("chinese", question.id);
    setFavorited(nowFav);
    setToast(nowFav ? "已加入收藏" : "已取消收藏");
    setTimeout(() => setToast(null), 1500);
  };

  const handleClose = () => {
    saveDailySession(session);
    navigate("/chinese");
  };

  const renderQuestion = () => {
    switch (question.type) {
      case "reading_choice":
      case "meaning_choice":
        return (
          <ChoiceQuestionUI
            question={question as ChoiceQuestion}
            showUnverifiedBadge={includeUnverified}
            isFavorited={favorited}
            onToggleFavorite={handleToggleFavorite}
            onAnswer={(idx, correct) => handleAnswer(idx, correct)}
            onNext={handleNext}
          />
        );
      case "fix_char":
        return (
          <FixCharQuestionUI
            question={question as FixChar}
            showUnverifiedBadge={includeUnverified}
            isFavorited={favorited}
            onToggleFavorite={handleToggleFavorite}
            onAnswer={(ans, correct) => handleAnswer(ans, correct)}
            onNext={handleNext}
          />
        );
      case "zhuyin_to_char":
        return (
          <ZhuyinToCharQuestionUI
            question={question as ZhuyinToChar}
            showUnverifiedBadge={includeUnverified}
            isFavorited={favorited}
            onToggleFavorite={handleToggleFavorite}
            onAnswer={(ans, correct) => handleAnswer(ans, correct)}
            onNext={handleNext}
          />
        );
      default:
        return <p className="text-muted text-center">不支援的題型</p>;
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-muted hover:bg-card-border/40 active:bg-card-border/60 transition-colors"
          aria-label="結束練習"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-2.5 rounded-full bg-success-soft overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className="text-sm font-bold text-ink whitespace-nowrap">
          {answeredCount} / {total}
        </span>

        <button
          onClick={handleToggleFavorite}
          className={`text-xl transition-colors ${favorited ? "text-pet" : "text-muted"}`}
          aria-label={favorited ? "取消收藏" : "收藏"}
        >
          {favorited ? "★" : "☆"}
        </button>
      </div>

      {/* Question area */}
      <div className="flex-1 px-4 pb-6 flex flex-col">
        {renderQuestion()}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          rounded-full bg-ink/80 px-5 py-2.5 text-sm font-medium text-white shadow-lg
          animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
