import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StepPills from "../components/StepPills";
import MathText from "../components/MathText";
import TiaoTiaoHeadHappy from "../components/pet/TiaoTiaoHeadHappy";
import TiaoTiaoHeadCurious from "../components/pet/TiaoTiaoHeadCurious";
import { analyzeImage, solveProblem, ApiError } from "../lib/api";
import type { AnalyzeProblem, SolveResult } from "../lib/api";
import { saveProgress, clearProgress } from "../lib/storage";

type Phase =
  | { step: "analyzing" }
  | { step: "choose"; problems: AnalyzeProblem[] }
  | { step: "confirm"; problem: AnalyzeProblem }
  | { step: "editing"; problem: AnalyzeProblem; editText: string }
  | { step: "solving" }
  | { step: "overview"; solve: SolveResult; problem: AnalyzeProblem }
  | { step: "error"; message: string };

export default function ConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageBase64, imageUrl } = (location.state ?? {}) as {
    imageBase64?: string;
    imageUrl?: string;
  };

  const [phase, setPhase] = useState<Phase>({ step: "analyzing" });

  useEffect(() => {
    if (!imageBase64) {
      navigate("/capture", { replace: true });
      return;
    }

    let cancelled = false;
    analyzeImage(imageBase64)
      .then((result) => {
        if (cancelled) return;
        if (result.problems.length === 1 && result.problems[0]) {
          setPhase({ step: "confirm", problem: result.problems[0] });
        } else if (result.problems.length > 0) {
          setPhase({ step: "choose", problems: result.problems });
        } else {
          setPhase({ step: "error", message: "看不到題目，請再拍一次" });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : "分析失敗，請再試一次";
        setPhase({ step: "error", message: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [imageBase64, navigate]);

  const handleChoose = useCallback((problem: AnalyzeProblem) => {
    setPhase({ step: "confirm", problem });
  }, []);

  const handleConfirm = useCallback(
    (problem: AnalyzeProblem) => {
      setPhase({ step: "solving" });
      solveProblem(problem.problem_text)
        .then((solve) => {
          setPhase({ step: "overview", solve, problem });
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof ApiError ? err.message : "解題分析失敗，請再試一次";
          setPhase({ step: "error", message: msg });
        });
    },
    [],
  );

  const handleEdit = useCallback((problem: AnalyzeProblem) => {
    setPhase({ step: "editing", problem, editText: problem.problem_text });
  }, []);

  const handleEditDone = useCallback(
    (original: AnalyzeProblem, editText: string) => {
      const updated: AnalyzeProblem = {
        ...original,
        problem_text: editText,
        problem_latex: editText,
      };
      setPhase({ step: "confirm", problem: updated });
    },
    [],
  );

  const handleRetake = useCallback(() => {
    navigate("/capture", { replace: true });
  }, [navigate]);

  // --- Analyzing ---
  if (phase.step === "analyzing") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={1} />
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="pet-bounce" style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadHappy className="w-full h-full" />
          </div>
          <p className="mt-4 text-lg font-medium text-ink animate-pulse">
            我正在看你的題目…
          </p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (phase.step === "error") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={1} />
        <div className="flex flex-col items-center px-6 pt-16">
          <div style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadCurious className="w-full h-full" />
          </div>
          <p className="mt-4 text-base text-fix font-medium text-center">
            {phase.message}
          </p>
          <button
            onClick={handleRetake}
            className="mt-6 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white
              shadow-[0_6px_0_0_var(--color-primary-pressed)]
              active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
              transition-all"
          >
            重新拍攝
          </button>
          <button
            onClick={() => navigate("/")}
            className="mt-3 text-sm text-muted"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

  // --- Choose problem ---
  if (phase.step === "choose") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={1} />
        <div className="px-4 pt-2">
          {/* Photo thumbnail */}
          {imageUrl && (
            <div className="rounded-2xl border border-card-border bg-card overflow-hidden mb-4">
              <img src={imageUrl} alt="題目照片" className="w-full max-h-40 object-contain" />
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0" style={{ width: 48, height: 48 }}>
              <TiaoTiaoHeadHappy className="w-full h-full" />
            </div>
            <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
              <p className="text-base text-ink">
                這張照片有好幾題，你要問哪一題？
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {phase.problems.map((p, i) => (
              <button
                key={i}
                onClick={() => handleChoose(p)}
                className="w-full text-left rounded-2xl border border-card-border bg-card px-4 py-4
                  active:bg-primary-soft transition-colors"
              >
                <span className="inline-block rounded-full bg-primary-soft text-primary text-xs font-bold px-2 py-0.5 mr-2">
                  第 {i + 1} 題
                </span>
                <MathText text={p.problem_latex} className="text-base text-ink" />
              </button>
            ))}
          </div>

          <button
            onClick={handleRetake}
            className="mt-4 w-full text-center text-sm text-muted py-2"
          >
            重新拍攝
          </button>
        </div>
      </div>
    );
  }

  // --- Editing ---
  if (phase.step === "editing") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={1} />
        <div className="px-4 pt-2">
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0" style={{ width: 48, height: 48 }}>
              <TiaoTiaoHeadHappy className="w-full h-full" />
            </div>
            <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
              <p className="text-base text-ink">把題目改成正確的吧！</p>
            </div>
          </div>

          <textarea
            value={phase.editText}
            onChange={(e) =>
              setPhase({ ...phase, editText: e.target.value })
            }
            rows={4}
            className="w-full rounded-2xl border border-card-border bg-card px-4 py-3 text-base text-ink
              focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />

          {/* Live KaTeX preview */}
          <div className="mt-3 rounded-2xl border border-card-border bg-card px-4 py-3">
            <p className="text-xs text-muted mb-1">預覽：</p>
            <MathText text={phase.editText} className="text-base text-ink" />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setPhase({ step: "confirm", problem: phase.problem })}
              className="flex-1 rounded-2xl border border-card-border bg-card px-4 py-4 text-sm font-bold text-ink
                active:bg-card-border/30 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => handleEditDone(phase.problem, phase.editText)}
              className="flex-1 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white
                shadow-[0_6px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              修改完成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Solving ---
  if (phase.step === "solving") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={2} />
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="pet-bounce" style={{ width: 80, height: 96 }}>
            <TiaoTiaoHeadHappy className="w-full h-full" />
          </div>
          <p className="mt-4 text-lg font-medium text-ink animate-pulse">
            讓我想一想…
          </p>
        </div>
      </div>
    );
  }

  // --- Overview (post-solve, pre-steps) ---
  if (phase.step === "overview") {
    return (
      <div className="min-h-dvh bg-bg">
        <StepPills current={2} />
        <div className="px-4 pt-2">
          {/* Problem card */}
          <div className="rounded-2xl border border-card-border bg-card px-4 py-3 mb-4">
            <p className="text-xs text-muted mb-1">題目</p>
            <MathText text={phase.problem.problem_latex} className="text-base text-ink" />
          </div>

          {/* 跳跳 overview hint */}
          <div className="flex items-start gap-3 mb-6">
            <div className="shrink-0 pet-bounce" style={{ width: 48, height: 48 }}>
              <TiaoTiaoHeadHappy className="w-full h-full" />
            </div>
            <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
              <MathText text={phase.solve.overview_hint} className="text-base text-ink leading-relaxed" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                saveProgress({
                  problem: phase.problem,
                  solve: phase.solve,
                  currentStep: 0,
                  hintLevel: 0,
                  messages: [],
                  usedHints: true,
                });
                navigate("/guided", {
                  state: { solve: phase.solve, problem: phase.problem },
                });
              }}
              className="w-full rounded-[24px] bg-primary px-6 py-5 text-lg font-bold text-white
                shadow-[0_8px_0_0_var(--color-primary-pressed)]
                active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
                transition-all"
            >
              帶我一步一步來
            </button>
            <button
              onClick={() => {
                clearProgress();
                navigate("/validate", {
                  state: {
                    solve: phase.solve,
                    problem: phase.problem,
                    usedHints: false,
                  },
                });
              }}
              className="w-full rounded-[24px] border-2 border-primary bg-primary-soft px-6 py-5 text-lg font-bold text-primary
                active:bg-primary/10 transition-colors"
            >
              我知道怎麼做了！
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="mt-6 w-full text-center text-sm text-muted py-2"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

  // --- Confirm ---
  return (
    <div className="min-h-dvh bg-bg">
      <StepPills current={1} />
      <div className="px-4 pt-2">
        {/* Photo */}
        {imageUrl && (
          <div className="rounded-2xl border border-card-border bg-card overflow-hidden mb-4 relative">
            <img src={imageUrl} alt="題目照片" className="w-full max-h-48 object-contain" />
            <button
              onClick={handleRetake}
              className="absolute top-2 right-2 rounded-full bg-ink/60 text-white text-xs px-3 py-1.5 font-medium"
            >
              重拍
            </button>
          </div>
        )}

        {/* 跳跳 bubble */}
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0" style={{ width: 48, height: 48 }}>
            <TiaoTiaoHeadHappy className="w-full h-full" />
          </div>
          <div className="rounded-2xl border border-card-border bg-card px-4 py-3 flex-1">
            <p className="text-sm text-muted mb-1">我看到的題目是這樣，對嗎？</p>
            <MathText text={phase.problem.problem_latex} className="text-base text-ink leading-relaxed" />
            <p className="text-xs text-muted mt-2">
              單元：{phase.problem.topic}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => handleEdit(phase.problem)}
            className="flex-1 rounded-2xl border border-card-border bg-card px-4 py-4 text-sm font-bold text-ink
              active:bg-card-border/30 transition-colors"
            style={{ minHeight: 56 }}
          >
            不對，我要修改
          </button>
          <button
            onClick={() => handleConfirm(phase.problem)}
            className="flex-1 rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white
              shadow-[0_6px_0_0_var(--color-primary-pressed)]
              active:translate-y-1 active:shadow-[0_3px_0_0_var(--color-primary-pressed)]
              transition-all"
            style={{ minHeight: 56 }}
          >
            對！開始解題
          </button>
        </div>

        <button
          onClick={handleRetake}
          className="mt-4 w-full text-center text-sm text-muted py-2"
        >
          重新拍攝
        </button>
      </div>
    </div>
  );
}
