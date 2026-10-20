import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StepPills from "../components/StepPills";
import CaptureScreen from "../components/CaptureScreen";
import MathText from "../components/MathText";
import CelebrationScreen from "../components/CelebrationScreen";
import CameraIcon from "../components/icons/CameraIcon";
import TiaoTiaoHeadHappy from "../components/pet/TiaoTiaoHeadHappy";
import TiaoTiaoHeadCurious from "../components/pet/TiaoTiaoHeadCurious";
import {
  generatePractice,
  solveProblem,
  validateWork,
  ApiError,
} from "../lib/api";
import type { PracticeProblem } from "../lib/api";
import { compareAnswers } from "../lib/compareAnswers";
import {
  getPracticeProgress,
  savePracticeProgress,
  clearPracticeProgress,
} from "../lib/storage";
import type { VerifiedPracticeProblem } from "../lib/storage";
import { recordSolve, type ScoreResult } from "../lib/scoring";

interface LocationState {
  problem_text: string;
  topic: string;
}

type Phase =
  | { step: "loading" }
  | { step: "generate_error"; message: string }
  | { step: "answering" }
  | { step: "capture" }
  | { step: "checking" }
  | { step: "correct"; feedback: string; score: ScoreResult }
  | { step: "incorrect"; feedback: string }
  | { step: "done" };

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as LocationState | undefined;

  const saved = getPracticeProgress();
  const originText = locState?.problem_text ?? saved?.originProblemText ?? "";
  const topic = locState?.topic ?? saved?.topic ?? "";

  const [problems, setProblems] = useState<VerifiedPracticeProblem[]>(
    saved?.problems ?? [],
  );
  const [currentIndex, setCurrentIndex] = useState(saved?.currentIndex ?? 0);
  const [attempts, setAttempts] = useState<number[]>(saved?.attempts ?? []);
  const [completed, setCompleted] = useState<boolean[]>(
    saved?.completed ?? [],
  );
  const [phase, setPhase] = useState<Phase>(
    saved && saved.problems.length > 0 ? { step: "answering" } : { step: "loading" },
  );
  const [answerText, setAnswerText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const totalProblems = problems.length;
  const currentProblem = problems[currentIndex] as VerifiedPracticeProblem | undefined;

  const persist = useCallback(
    (
      probs: VerifiedPracticeProblem[],
      idx: number,
      att: number[],
      comp: boolean[],
    ) => {
      savePracticeProgress({
        originProblemText: originText,
        topic,
        problems: probs,
        currentIndex: idx,
        attempts: att,
        completed: comp,
      });
    },
    [originText, topic],
  );

  useEffect(() => {
    if (phase.step !== "loading") return;
    if (problems.length > 0) return;

    if (!originText || !topic) {
      navigate("/math", { replace: true });
      return;
    }

    let cancelled = false;

    async function generate() {
      try {
        const practiceResult = await generatePractice({
          problem_text: originText,
          topic,
          count: 2,
        });

        if (cancelled) return;

        const verified = await verifyProblems(practiceResult.problems, topic);

        if (cancelled) return;

        if (verified.length === 0) {
          setPhase({
            step: "generate_error",
            message: "這次出題不太順利，我們再試一次好嗎？",
          });
          return;
        }

        const att = verified.map(() => 1);
        const comp = verified.map(() => false);
        setProblems(verified);
        setAttempts(att);
        setCompleted(comp);
        setCurrentIndex(0);
        setPhase({ step: "answering" });
        savePracticeProgress({
          originProblemText: originText,
          topic,
          problems: verified,
          currentIndex: 0,
          attempts: att,
          completed: comp,
        });
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : "練習題產生失敗，請再試一次";
        setPhase({ step: "generate_error", message: msg });
      }
    }

    generate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.step]);

  async function verifyProblems(
    raw: PracticeProblem[],
    topicName: string,
  ): Promise<VerifiedPracticeProblem[]> {
    const results: VerifiedPracticeProblem[] = [];

    const solvePromises = raw.map((p) =>
      solveProblem(p.problem_text).catch(() => null),
    );
    const solves = await Promise.all(solvePromises);

    for (let i = 0; i < raw.length; i++) {
      const p = raw[i]!;
      const solve = solves[i];
      if (!solve) continue;

      const cmp = compareAnswers(p.final_answer, solve.final_answer);
      if (cmp === "equal") {
        results.push({
          ...p,
          solve,
          problemId: crypto.randomUUID(),
        });
        continue;
      }

      try {
        const retry = await generatePractice({
          problem_text: originText,
          topic: topicName,
          count: 1,
          difficulty: i === 0 ? "same" : "harder",
        });
        const rp = retry.problems[0];
        if (!rp) continue;

        const rSolve = await solveProblem(rp.problem_text);
        const rCmp = compareAnswers(rp.final_answer, rSolve.final_answer);
        if (rCmp === "equal") {
          results.push({
            ...rp,
            solve: rSolve,
            problemId: crypto.randomUUID(),
          });
          continue;
        }

        const retry2 = await generatePractice({
          problem_text: originText,
          topic: topicName,
          count: 1,
          difficulty: i === 0 ? "same" : "harder",
        });
        const rp2 = retry2.problems[0];
        if (!rp2) continue;

        const rSolve2 = await solveProblem(rp2.problem_text);
        const rCmp2 = compareAnswers(rp2.final_answer, rSolve2.final_answer);
        if (rCmp2 === "equal") {
          results.push({
            ...rp2,
            solve: rSolve2,
            problemId: crypto.randomUUID(),
          });
        }
      } catch {
        // skip
      }
    }

    return results;
  }

  const doScoreCorrect = useCallback(
    (prob: VerifiedPracticeProblem): ScoreResult => {
      return recordSolve({
        subject: "math",
        problemId: prob.problemId,
        topic,
        usedHints: true,
        snackAmount: 1,
      });
    },
    [topic],
  );

  const handleTextSubmit = useCallback(async () => {
    const text = answerText.trim();
    if (!text || !currentProblem) return;

    const cmp = compareAnswers(text, currentProblem.final_answer);
    if (cmp === "equal") {
      const score = doScoreCorrect(currentProblem);
      const newCompleted = [...completed];
      newCompleted[currentIndex] = true;
      setCompleted(newCompleted);
      persist(problems, currentIndex, attempts, newCompleted);
      setAnswerText("");
      setPhase({
        step: "correct",
        feedback: "做得好！你的答案完全正確！",
        score,
      });
      return;
    }
    if (cmp === "different") {
      const newAttempts = [...attempts];
      newAttempts[currentIndex] = (newAttempts[currentIndex] ?? 1) + 1;
      setAttempts(newAttempts);
      persist(problems, currentIndex, newAttempts, completed);
      setAnswerText("");
      setPhase({
        step: "incorrect",
        feedback: "再想想看喔！答案好像不太對。",
      });
      return;
    }

    setPhase({ step: "checking" });
    try {
      const result = await validateWork({
        student_answer: text,
        problem_text: currentProblem.problem_text,
        final_answer: currentProblem.final_answer,
        solution_steps: currentProblem.solve.solution_steps,
        attempt: attempts[currentIndex] ?? 1,
      });

      if (result.result === "correct" || result.result === "partially_correct") {
        const score = doScoreCorrect(currentProblem);
        const newCompleted = [...completed];
        newCompleted[currentIndex] = true;
        setCompleted(newCompleted);
        persist(problems, currentIndex, attempts, newCompleted);
        setAnswerText("");
        setPhase({ step: "correct", feedback: result.feedback, score });
      } else {
        const newAttempts = [...attempts];
        newAttempts[currentIndex] = (newAttempts[currentIndex] ?? 1) + 1;
        setAttempts(newAttempts);
        persist(problems, currentIndex, newAttempts, completed);
        setAnswerText("");
        setPhase({ step: "incorrect", feedback: result.feedback });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "批改失敗，請再試一次";
      setPhase({ step: "incorrect", feedback: msg });
    }
  }, [answerText, currentProblem, attempts, completed, currentIndex, problems, persist, doScoreCorrect]);

  const handlePhotoCapture = useCallback(
    async (imageBase64: string) => {
      if (!currentProblem) return;
      setPhase({ step: "checking" });

      try {
        const result = await validateWork({
          image: imageBase64,
          problem_text: currentProblem.problem_text,
          final_answer: currentProblem.final_answer,
          solution_steps: currentProblem.solve.solution_steps,
          attempt: attempts[currentIndex] ?? 1,
        });

        if (result.result === "correct" || result.result === "partially_correct") {
          const score = doScoreCorrect(currentProblem);
          const newCompleted = [...completed];
          newCompleted[currentIndex] = true;
          setCompleted(newCompleted);
          persist(problems, currentIndex, attempts, newCompleted);
          setPhase({ step: "correct", feedback: result.feedback, score });
        } else if (result.result === "unreadable") {
          setPhase({ step: "incorrect", feedback: result.feedback });
        } else {
          const newAttempts = [...attempts];
          newAttempts[currentIndex] = (newAttempts[currentIndex] ?? 1) + 1;
          setAttempts(newAttempts);
          persist(problems, currentIndex, newAttempts, completed);
          setPhase({ step: "incorrect", feedback: result.feedback });
        }
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "批改失敗，請再試一次";
        setPhase({ step: "incorrect", feedback: msg });
      }
    },
    [currentProblem, attempts, completed, currentIndex, problems, persist, doScoreCorrect],
  );

  const handleNextProblem = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalProblems) {
      clearPracticeProgress();
      setPhase({ step: "done" });
    } else {
      setCurrentIndex(nextIdx);
      setAnswerText("");
      persist(problems, nextIdx, attempts, completed);
      setPhase({ step: "answering" });
    }
  }, [currentIndex, totalProblems, problems, attempts, completed, persist]);

  const handleGetHint = useCallback(() => {
    if (!currentProblem) return;
    navigate("/math/guided", {
      state: {
        solve: currentProblem.solve,
        problem: {
          problem_latex: currentProblem.problem_latex,
          problem_text: currentProblem.problem_text,
          topic,
        },
        problemId: currentProblem.problemId,
        resumeStep: 0,
        resumeHintLevel: 0,
        resumeMessages: [],
        resumeUsedHints: true,
        practiceMode: true,
        practiceIndex: currentIndex,
      },
    });
  }, [currentProblem, navigate, topic, currentIndex]);

  const handleRetry = useCallback(() => {
    setAnswerText("");
    setPhase({ step: "answering" });
  }, []);

  const handleRegenerate = useCallback(() => {
    setProblems([]);
    setCurrentIndex(0);
    setAttempts([]);
    setCompleted([]);
    clearPracticeProgress();
    setPhase({ step: "loading" });
  }, []);

  const handleGoHome = useCallback(() => {
    clearPracticeProgress();
    navigate("/math", { replace: true });
  }, [navigate]);

  // === LOADING ===
  if (phase.step === "loading") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={4} />
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="pet-bounce" style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadHappy className="w-full h-full" />
          </div>
          <p className="mt-4 text-lg font-medium text-ink animate-pulse">
            跳跳在幫你出題目…
          </p>
        </div>
      </div>
    );
  }

  // === GENERATE ERROR ===
  if (phase.step === "generate_error") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={4} />
        <div className="flex flex-col items-center px-6 pt-16">
          <div style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadCurious className="w-full h-full" />
          </div>
          <p className="mt-4 text-base text-ink font-medium text-center">
            {phase.message}
          </p>
          <div className="mt-6 w-full space-y-3">
            <button
              onClick={handleRegenerate}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              重新出題
            </button>
            <button
              onClick={handleGoHome}
              className="w-full text-center text-sm text-muted py-2"
            >
              回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === CAPTURE ===
  if (phase.step === "capture") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col">
        <StepPills current={4} />
        <CaptureScreen
          onBack={() => setPhase({ step: "answering" })}
          onCapture={(base64) => handlePhotoCapture(base64)}
          buttonLabel={<span className="inline-flex items-center gap-2"><CameraIcon className="w-5 h-5" />拍下我的算式</span>}
          sendLabel="確認送出"
        />
      </div>
    );
  }

  // === CHECKING ===
  if (phase.step === "checking") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={4} />
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="pet-bounce" style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadCurious className="w-full h-full" />
          </div>
          <p className="mt-4 text-lg font-medium text-ink animate-pulse">
            讓我看看…
          </p>
        </div>
      </div>
    );
  }

  // === CORRECT ===
  if (phase.step === "correct") {
    const { score } = phase;
    const isLast = currentIndex + 1 >= totalProblems;
    return (
      <CelebrationScreen
        feedback={phase.feedback}
        snacksEarned={score.snacksEarned}
        solvedCount={score.newSolvedCount}
        equippedAccessories={score.equippedAccessories}
        prevLevel={score.prevLevel}
        newLevel={score.newLevel}
        newAccessories={score.newAccessories}
        buttons={
          isLast ? (
            <button
              onClick={handleNextProblem}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              完成！
            </button>
          ) : (
            <button
              onClick={handleNextProblem}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              下一題 →
            </button>
          )
        }
      />
    );
  }

  // === INCORRECT ===
  if (phase.step === "incorrect") {
    return (
      <div className="min-h-dvh bg-bg pb-8">
        <StepPills current={4} />
        <div className="px-4 pt-4">
          <div className="flex items-start gap-3 mb-6">
            <div className="shrink-0" style={{ width: 48, height: 48 }}>
              <TiaoTiaoHeadCurious className="w-full h-full" />
            </div>
            <div className="flex-1">
              <div className="inline-block rounded-full bg-fix-soft px-3 py-1 mb-2">
                <span className="text-fix text-sm font-bold">差一點點</span>
              </div>
              <div className="rounded-2xl border border-card-border bg-card px-4 py-3">
                <MathText
                  text={phase.feedback}
                  className="text-base text-ink leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              再試一次
            </button>
            <button
              onClick={handleGetHint}
              className="w-full rounded-[24px] border-2 border-primary bg-primary-soft px-6 py-5 text-lg font-bold text-primary
                active:bg-primary/10 transition-colors"
            >
              需要提示
            </button>
          </div>

          <button
            onClick={handleGoHome}
            className="mt-4 w-full text-center text-sm text-muted py-2"
          >
            今天先到這裡
          </button>
        </div>
      </div>
    );
  }

  // === DONE ===
  if (phase.step === "done") {
    return (
      <CelebrationScreen
        feedback={totalProblems >= 2 ? "兩題都完成了，太厲害了！跳跳為你驕傲！" : "一題完成了，太厲害了！"}
        snacksEarned={0}
        solvedCount={0}
        equippedAccessories={[]}
        buttons={
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-[24px] border-2 border-card-border bg-card px-6 py-5 text-lg font-bold text-ink
              active:bg-card-border/30 transition-colors"
          >
            回首頁
          </button>
        }
      />
    );
  }

  // === ANSWERING ===
  if (!currentProblem) return null;

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <StepPills current={4} />
      <div className="px-4 pt-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          {problems.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-primary"
                  : completed[i]
                    ? "bg-success"
                    : "bg-card-border"
              }`}
            />
          ))}
          <span className="text-xs text-muted ml-1">
            練習題 {currentIndex + 1} / {totalProblems}
          </span>
        </div>

        <div className="rounded-2xl border border-card-border bg-card px-4 py-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block rounded-full bg-primary-soft text-primary text-xs font-bold px-2 py-0.5">
              康軒 7 上
            </span>
            <span className="text-xs text-muted">{topic}</span>
          </div>
          <MathText
            text={currentProblem.problem_latex}
            className="text-base text-ink leading-relaxed"
          />
        </div>

        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0" style={{ width: 48, height: 48 }}>
            <TiaoTiaoHeadHappy className="w-full h-full" />
          </div>
          <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
            <p className="text-base text-ink">
              {currentIndex === 0 ? "來試試看這題吧！" : "再來一題！"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card px-4 py-4 mb-3">
          <p className="text-xs text-muted mb-2">輸入答案：</p>
          <div className="flex items-center gap-2">
            {currentProblem.answer_prefix && (
              <span className="text-base font-medium text-ink whitespace-nowrap">
                {currentProblem.answer_prefix}
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTextSubmit();
              }}
              placeholder="你的答案"
              className="flex-1 rounded-xl border border-card-border bg-bg px-3 py-2.5 text-base text-ink
                placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTextSubmit}
            disabled={!answerText.trim()}
            className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
              shadow-[0_8px_0_0_var(--color-primary-pressed)]
              active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
              disabled:opacity-40 transition-all"
          >
            送出
          </button>
          <button
            onClick={() => setPhase({ step: "capture" })}
            className="w-full rounded-[24px] border-2 border-primary bg-primary-soft px-6 py-5 text-lg font-bold text-primary
              active:bg-primary/10 transition-colors"
          >
            <span className="inline-flex items-center gap-2 justify-center w-full"><CameraIcon className="w-5 h-5" />拍下我的算式</span>
          </button>
          <button
            onClick={handleGetHint}
            className="w-full rounded-[24px] border border-card-border bg-card px-6 py-4 text-base font-medium text-ink
              active:bg-card-border/30 transition-colors"
          >
            需要提示
          </button>
        </div>

        <button
          onClick={handleGoHome}
          className="mt-4 w-full text-center text-sm text-muted py-2"
        >
          今天先到這裡
        </button>
      </div>
    </div>
  );
}
