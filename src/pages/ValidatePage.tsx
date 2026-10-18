import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StepPills from "../components/StepPills";
import CaptureScreen from "../components/CaptureScreen";
import MathText from "../components/MathText";
import TiaoTiaoHeadCurious from "../components/pet/TiaoTiaoHeadCurious";
import TiaoTiaoCheer from "../components/pet/TiaoTiaoCheer";
import { validateWork, ApiError } from "../lib/api";
import type { AnalyzeProblem, SolveResult, ValidateResult } from "../lib/api";
import {
  getProgress,
  saveProgress,
  clearProgress,
  addSolveEntry,
  getPetState,
  savePetState,
  isScoredProblem,
  markProblemScored,
} from "../lib/storage";

interface LocationState {
  solve: SolveResult;
  problem: AnalyzeProblem;
  usedHints: boolean;
  problemId: string;
  practiceMode?: boolean;
  practiceIndex?: number;
}

type Phase =
  | { step: "capture" }
  | { step: "validating" }
  | { step: "result"; imageUrl: string; data: ValidateResult }
  | { step: "success"; data: ValidateResult; snacksEarned: number };

export default function ValidatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as LocationState | undefined;

  const progress = getProgress();
  const solve = locState?.solve ?? progress?.solve;
  const problem = locState?.problem ?? progress?.problem;
  const problemId = locState?.problemId ?? progress?.problemId ?? "";

  const practiceMode = locState?.practiceMode ?? false;
  const practiceIndex = locState?.practiceIndex ?? 0;

  const [usedHints, setUsedHints] = useState(
    () => locState?.usedHints ?? progress?.usedHints ?? true,
  );
  const [attempt, setAttempt] = useState(() => progress?.attempt ?? 1);
  const [phase, setPhase] = useState<Phase>({ step: "capture" });

  useEffect(() => {
    if (!solve || !problem || !problemId) {
      navigate("/", { replace: true });
    }
  }, [solve, problem, problemId, navigate]);

  const persistAttempt = useCallback(
    (nextAttempt: number, nextUsedHints?: boolean) => {
      if (!solve || !problem || !problemId) return;
      if (practiceMode) return;
      saveProgress({
        problem,
        solve,
        usedHints: nextUsedHints ?? usedHints,
        problemId,
        attempt: nextAttempt,
        currentStep: solve.solution_steps.length - 1,
        hintLevel: 0,
        messages: [],
      });
    },
    [solve, problem, problemId, usedHints, practiceMode],
  );

  const handleCapture = useCallback(
    async (imageBase64: string, imageUrl: string) => {
      if (!solve || !problem) return;
      setPhase({ step: "validating" });

      try {
        const currentAttempt = attempt;
        const result = await validateWork({
          image: imageBase64,
          problem_text: problem.problem_text,
          final_answer: solve.final_answer,
          solution_steps: solve.solution_steps,
          attempt: currentAttempt,
        });

        if (
          result.result === "correct" ||
          result.result === "partially_correct"
        ) {
          if (practiceMode) {
            navigate("/practice", { replace: true });
            return;
          }

          let snacksEarned = 0;
          if (!isScoredProblem(problemId)) {
            markProblemScored(problemId);
            addSolveEntry(problem.topic ?? solve.topic, usedHints);

            const firstTryNoHints = currentAttempt === 1 && !usedHints;
            snacksEarned = firstTryNoHints ? 2 : 1;

            const pet = getPetState();
            savePetState({
              ...pet,
              solvedCount: pet.solvedCount + 1,
              snacks: pet.snacks + snacksEarned,
            });
          }

          clearProgress();
          setPhase({ step: "success", data: result, snacksEarned });
        } else if (result.result === "unreadable") {
          setPhase({ step: "result", imageUrl, data: result });
        } else {
          const nextAttempt = currentAttempt + 1;
          setAttempt(nextAttempt);
          persistAttempt(nextAttempt);
          setPhase({ step: "result", imageUrl, data: result });
        }
      } catch (err) {
        const msg =
          err instanceof ApiError ? err.message : "批改失敗，請再試一次";
        setPhase({
          step: "result",
          imageUrl,
          data: {
            result: "unreadable",
            lines: [],
            first_error_line_index: null,
            related_step_index: null,
            feedback: `⚠️ ${msg}`,
          },
        });
      }
    },
    [solve, problem, attempt, usedHints, problemId, persistAttempt],
  );

  const handleRetry = useCallback(() => {
    setPhase({ step: "capture" });
  }, []);

  const handleRetakeUnreadable = useCallback(() => {
    setPhase({ step: "capture" });
  }, []);

  const handleGetHint = useCallback(
    (relatedStepIndex: number | null) => {
      if (!solve || !problem || !problemId) return;
      setUsedHints(true);
      const stepToResume = relatedStepIndex ?? 0;
      if (!practiceMode) {
        saveProgress({
          problem,
          solve,
          usedHints: true,
          problemId,
          attempt,
          currentStep: stepToResume,
          hintLevel: 0,
          messages: [],
        });
      }
      navigate("/guided", {
        state: {
          solve,
          problem,
          problemId,
          resumeStep: stepToResume,
          resumeHintLevel: 0,
          resumeMessages: [],
          resumeUsedHints: true,
          practiceMode,
          practiceIndex,
        },
      });
    },
    [solve, problem, problemId, attempt, navigate, practiceMode, practiceIndex],
  );

  if (!solve || !problem) return null;

  // === CAPTURE ===
  if (phase.step === "capture") {
    return (
      <div className="min-h-dvh bg-bg flex flex-col">
        <StepPills current={3} />
        <CaptureScreen
          onBack={() => navigate(-1)}
          onCapture={handleCapture}
          buttonLabel="📷 拍下我的算式"
          sendLabel="確認送出"
        />
      </div>
    );
  }

  // === VALIDATING ===
  if (phase.step === "validating") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={3} />
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="pet-bounce" style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadCurious className="w-full h-full" />
          </div>
          <p className="mt-4 text-lg font-medium text-ink animate-pulse">
            我在看你的算式…
          </p>
        </div>
      </div>
    );
  }

  // === SUCCESS ===
  if (phase.step === "success") {
    const isPartial = phase.data.result === "partially_correct";
    return (
      <div className="min-h-dvh bg-bg pb-8">
        <StepPills current={3} />
        <div className="flex flex-col items-center px-6 pt-8">
          <div style={{ width: 160, height: 160 }}>
            <TiaoTiaoCheer className="w-full h-full" />
          </div>

          <div className="mt-4 rounded-full bg-success-soft px-5 py-2">
            <span className="text-success text-lg font-bold">答對了！</span>
          </div>

          <div className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-3 w-full">
            <MathText
              text={phase.data.feedback}
              className="text-base text-ink leading-relaxed"
            />
          </div>

          {isPartial &&
            phase.data.first_error_line_index !== null &&
            phase.data.lines.length > 0 && (
              <div className="mt-3 rounded-2xl border border-fix/30 bg-fix-soft px-4 py-3 w-full">
                <p className="text-sm text-fix font-medium mb-1">
                  有一行可以再注意：
                </p>
                <MathText
                  text={
                    phase.data.lines[phase.data.first_error_line_index] ?? ""
                  }
                  className="text-sm text-ink"
                />
              </div>
            )}

          {phase.snacksEarned > 0 && (
            <div className="mt-4 rounded-2xl bg-pet-soft px-5 py-3 flex items-center gap-2">
              <span className="text-2xl">🦴</span>
              <span className="text-pet font-bold text-lg">
                點心 +{phase.snacksEarned}
              </span>
            </div>
          )}

          <div className="mt-6 w-full space-y-3">
            <button
              onClick={() =>
                navigate("/practice", {
                  state: {
                    problem_text: problem.problem_text,
                    topic: problem.topic ?? solve.topic,
                  },
                })
              }
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              再來挑戰 2 題練習題
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-[24px] border-2 border-card-border bg-card px-6 py-5 text-lg font-bold text-ink
                active:bg-card-border/30 transition-colors"
            >
              回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === RESULT (incorrect / unreadable) ===
  const { data, imageUrl } = phase;
  const isUnreadable = data.result === "unreadable";

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <StepPills current={3} />
      <div className="px-4 pt-2">
        {/* Student's work photo */}
        <div className="rounded-2xl border border-card-border bg-card overflow-hidden mb-4">
          <img
            src={imageUrl}
            alt="我的算式"
            className="w-full max-h-48 object-contain"
          />
        </div>

        {isUnreadable ? (
          <>
            <div className="flex items-start gap-3 mb-6">
              <div className="shrink-0" style={{ width: 48, height: 48 }}>
                <TiaoTiaoHeadCurious className="w-full h-full" />
              </div>
              <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
                <MathText
                  text={data.feedback}
                  className="text-base text-ink leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleRetakeUnreadable}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              📷 再拍一次
            </button>
          </>
        ) : (
          <>
            {/* Lines with error highlighting */}
            {data.lines.length > 0 && (
              <div className="rounded-2xl border border-card-border bg-card px-4 py-3 mb-4 space-y-2">
                {data.lines.map((line, i) => {
                  const isError = i === data.first_error_line_index;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl px-3 py-2 ${
                        isError
                          ? "border-2 border-dashed border-fix bg-fix-soft"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted mt-0.5 shrink-0">
                          {i + 1}.
                        </span>
                        <MathText
                          text={line}
                          className="text-[15px] text-ink flex-1"
                        />
                        {isError && (
                          <span className="shrink-0 rounded-full bg-fix text-white text-xs px-2 py-0.5 font-bold whitespace-nowrap">
                            再看一次
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback */}
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
                    text={data.feedback}
                    className="text-base text-ink leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleGetHint(data.related_step_index)}
                className="w-full rounded-[24px] border-2 border-primary bg-primary-soft px-6 py-5 text-lg font-bold text-primary
                  active:bg-primary/10 transition-colors"
              >
                給我一點提示
              </button>
              <button
                onClick={handleRetry}
                className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                  shadow-[0_8px_0_0_var(--color-primary-pressed)]
                  active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                  transition-all"
              >
                改好了，再拍一次
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
