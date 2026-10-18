import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StepPills from "../components/StepPills";
import MathText from "../components/MathText";
import TiaoTiaoHeadHappy from "../components/pet/TiaoTiaoHeadHappy";
import TiaoTiaoHeadCurious from "../components/pet/TiaoTiaoHeadCurious";
import { requestHint, ApiError } from "../lib/api";
import type { AnalyzeProblem, SolveResult } from "../lib/api";
import type { ChatMessage } from "../lib/storage";
import { saveProgress, getProgress } from "../lib/storage";

interface LocationState {
  solve: SolveResult;
  problem: AnalyzeProblem;
  problemId?: string;
  resumeStep?: number;
  resumeHintLevel?: number;
  resumeMessages?: ChatMessage[];
  resumeUsedHints?: boolean;
  practiceMode?: boolean;
  practiceIndex?: number;
}

export default function GuidedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const solve = state?.solve;
  const problem = state?.problem;

  const progressData = getProgress();
  const problemId = state?.problemId ?? progressData?.problemId ?? "";
  const practiceMode = state?.practiceMode ?? false;
  const practiceIndex = state?.practiceIndex ?? 0;

  const [currentStep, setCurrentStep] = useState(state?.resumeStep ?? 0);
  const [hintLevel, setHintLevel] = useState(state?.resumeHintLevel ?? 0);
  const [messages, setMessages] = useState<ChatMessage[]>(
    state?.resumeMessages ?? [],
  );
  const [usedHints, setUsedHints] = useState(state?.resumeUsedHints ?? true);
  const [loading, setLoading] = useState(false);
  const [thoughtText, setThoughtText] = useState("");
  const [allDone, setAllDone] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!solve || !problem) {
      navigate("/", { replace: true });
    }
  }, [solve, problem, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist progress (skip in practice mode to not overwrite original problem)
  useEffect(() => {
    if (!solve || !problem) return;
    if (practiceMode) return;
    const prev = getProgress();
    saveProgress({
      problemId: problemId || prev?.problemId || "",
      problem,
      solve,
      currentStep,
      hintLevel,
      messages,
      usedHints,
      attempt: prev?.attempt ?? 1,
    });
  }, [currentStep, hintLevel, messages, usedHints, solve, problem, problemId, practiceMode]);

  const totalSteps = solve?.solution_steps.length ?? 0;

  const getRecentMessages = useCallback((): { role: "tutor" | "student"; text: string }[] => {
    return messages.slice(-6);
  }, [messages]);

  const fetchHint = useCallback(
    async (level: 1 | 2 | 3, studentThought?: string) => {
      if (!solve || !problem) return;
      setLoading(true);
      try {
        const result = await requestHint({
          problem_text: problem.problem_text,
          solution_steps: solve.solution_steps,
          step_index: currentStep,
          hint_level: level,
          final_answer: solve.final_answer,
          student_thought: studentThought,
          recent_messages: getRecentMessages(),
        });
        setMessages((prev) => [...prev, { role: "tutor", text: result.message }]);
        setHintLevel(level);
        setUsedHints(true);
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "提示產生失敗，請再試一次";
        setMessages((prev) => [
          ...prev,
          { role: "tutor", text: `⚠️ ${msg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [solve, problem, currentStep, getRecentMessages],
  );

  // Auto-fetch hint level 1 when entering a new step
  useEffect(() => {
    if (!solve || !problem) return;
    if (allDone) return;
    // Only auto-fetch if no messages exist for this step yet
    // We detect "new step" by hintLevel being 0
    if (hintLevel === 0 && !loading) {
      fetchHint(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, allDone]);

  const handleMoreHint = useCallback(() => {
    if (hintLevel < 3) {
      fetchHint((hintLevel + 1) as 1 | 2 | 3);
    }
  }, [hintLevel, fetchHint]);

  const handleStuck = useCallback(() => {
    fetchHint(3);
  }, [fetchHint]);

  const handleThoughtSubmit = useCallback(() => {
    const text = thoughtText.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "student", text }]);
    setThoughtText("");

    const level = Math.max(hintLevel, 1) as 1 | 2 | 3;
    fetchHint(level, text);
  }, [thoughtText, hintLevel, fetchHint]);

  const handleNextStep = useCallback(() => {
    const next = currentStep + 1;
    if (next >= totalSteps) {
      setAllDone(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          text: "全部步驟都走完了！把你的算式拍下來給我看看吧！",
        },
      ]);
    } else {
      setCurrentStep(next);
      setHintLevel(0);
    }
  }, [currentStep, totalSteps]);

  const handleSkip = useCallback(() => {
    if (practiceMode) {
      navigate("/practice", { replace: true });
      return;
    }
    navigate("/validate", {
      state: { solve, problem, usedHints, problemId },
      replace: true,
    });
  }, [navigate, solve, problem, usedHints, problemId, practiceMode]);

  const handleTakePhoto = useCallback(() => {
    navigate("/validate", {
      state: { solve, problem, usedHints, problemId, practiceMode, practiceIndex },
      replace: true,
    });
  }, [navigate, solve, problem, usedHints, problemId, practiceMode, practiceIndex]);

  if (!solve || !problem) return null;

  const canAskMore = hintLevel > 0 && hintLevel < 3 && !loading;
  const canStuck = hintLevel > 0 && hintLevel < 3 && !loading;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <StepPills current={2} />

      {/* Problem header */}
      <div className="px-4 pt-1 pb-2">
        <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block rounded-full bg-primary-soft text-primary text-xs font-bold px-2 py-0.5 whitespace-nowrap">
                第 {currentStep + 1} / {totalSteps} 步
              </span>
              {!allDone && (
                <span className="text-xs text-muted truncate">
                  {solve.solution_steps[currentStep]}
                </span>
              )}
            </div>
            <MathText
              text={problem.problem_latex}
              className="text-sm text-ink"
            />
          </div>
          {!allDone && (
            <button
              onClick={handleSkip}
              className="text-xs text-primary font-medium whitespace-nowrap min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            >
              我知道怎麼做了！
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.role === "student" ? "flex-row-reverse" : ""
              }`}
            >
              {msg.role === "tutor" && (
                <div
                  className="shrink-0"
                  style={{ width: 36, height: 36 }}
                >
                  <TiaoTiaoHeadHappy className="w-full h-full" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] ${
                  msg.role === "student"
                    ? "bg-primary text-white"
                    : "border border-card-border bg-card text-ink"
                }`}
              >
                <MathText
                  text={msg.text}
                  className={`text-[15px] leading-relaxed ${
                    msg.role === "student" ? "text-white" : "text-ink"
                  }`}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 pet-bounce" style={{ width: 36, height: 36 }}>
                <TiaoTiaoHeadCurious className="w-full h-full" />
              </div>
              <div className="rounded-2xl border border-card-border bg-card px-3.5 py-2.5">
                <p className="text-[15px] text-muted animate-pulse">
                  讓我想一想…
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom action area */}
      <div className="border-t border-card-border bg-card px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {allDone ? (
          <button
            onClick={handleTakePhoto}
            className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
              shadow-[0_8px_0_0_var(--color-primary-pressed)]
              active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
              transition-all"
          >
            📷 拍下我的算式
          </button>
        ) : (
          <>
            {/* Text input */}
            <div className="flex items-end gap-2 mb-3">
              <textarea
                ref={inputRef}
                value={thoughtText}
                onChange={(e) => setThoughtText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleThoughtSubmit();
                  }
                }}
                placeholder="我的想法是…"
                rows={1}
                disabled={loading}
                className="flex-1 rounded-2xl border border-card-border bg-bg px-3.5 py-2.5 text-[15px] text-ink
                  placeholder:text-muted/60 resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary
                  disabled:opacity-50"
              />
              <button
                onClick={handleThoughtSubmit}
                disabled={!thoughtText.trim() || loading}
                className="shrink-0 rounded-full bg-primary w-10 h-10 flex items-center justify-center text-white
                  disabled:opacity-40 active:scale-95 transition-all"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Secondary buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleMoreHint}
                disabled={!canAskMore}
                className="flex-1 rounded-2xl border border-card-border bg-bg px-3 py-3 text-sm font-medium text-ink
                  disabled:opacity-40 active:bg-card-border/30 transition-colors"
              >
                再給我一點提示
              </button>
              <button
                onClick={handleStuck}
                disabled={!canStuck}
                className="flex-1 rounded-2xl border border-card-border bg-bg px-3 py-3 text-sm font-medium text-ink
                  disabled:opacity-40 active:bg-card-border/30 transition-colors"
              >
                我還是卡住了
              </button>
            </div>

            {/* Primary button — always available */}
            <button
              onClick={handleNextStep}
              disabled={loading}
              className="w-full rounded-[24px] bg-primary px-6 py-4 text-base font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                disabled:opacity-40 transition-all"
            >
              這步做好了，下一步 →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
