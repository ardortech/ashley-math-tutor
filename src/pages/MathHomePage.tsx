import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraIcon from "../components/icons/CameraIcon";
import TiaoTiaoHeadHappy from "../components/pet/TiaoTiaoHeadHappy";
import MathText from "../components/MathText";
import { getTodayCount, getWeekCount, getProgress, clearProgress } from "../lib/storage";

export default function MathHomePage() {
  const navigate = useNavigate();
  const todayCount = getTodayCount("math");
  const weekCount = getWeekCount("math");
  const [progress] = useState(() => getProgress());
  const [showResume, setShowResume] = useState(!!progress);

  const handleResume = () => {
    if (!progress) return;
    setShowResume(false);
    navigate("/math/guided", {
      state: {
        solve: progress.solve,
        problem: progress.problem,
        problemId: progress.problemId,
        resumeStep: progress.currentStep,
        resumeHintLevel: progress.hintLevel,
        resumeMessages: progress.messages,
        resumeUsedHints: progress.usedHints,
      },
    });
  };

  const handleAbandon = () => {
    clearProgress();
    setShowResume(false);
  };

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate("/")}
          className="rounded-full p-2 text-muted hover:bg-card-border/40 active:bg-card-border/60 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-ink">數學</h1>
      </header>

      {/* Resume prompt */}
      {showResume && progress && (
        <div className="px-4 mt-2">
          <div className="rounded-2xl border border-card-border bg-card p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0" style={{ width: 40, height: 40 }}>
                <TiaoTiaoHeadHappy className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-ink mb-1">
                  要繼續剛剛那題嗎？
                </p>
                <MathText
                  text={progress.problem.problem_latex}
                  className="text-sm text-muted"
                />
                <p className="text-xs text-muted mt-1">
                  第 {progress.currentStep + 1} / {progress.solve.solution_steps.length} 步
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAbandon}
                className="flex-1 rounded-2xl border border-card-border bg-bg px-3 py-3 text-sm font-medium text-ink
                  active:bg-card-border/30 transition-colors"
              >
                放棄
              </button>
              <button
                onClick={handleResume}
                className="flex-1 rounded-2xl bg-primary px-3 py-3 text-sm font-bold text-white
                  shadow-[0_4px_0_0_var(--color-primary-pressed)]
                  active:translate-y-1 active:shadow-[0_2px_0_0_var(--color-primary-pressed)]
                  transition-all"
              >
                繼續
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Big capture button */}
      <div className="px-4 mt-4">
        <button
          onClick={() => navigate("/math/capture")}
          className="w-full flex items-center justify-center gap-3 rounded-[24px] bg-primary
            px-6 py-6 text-xl font-bold text-white
            shadow-[0_10px_0_0_var(--color-primary-pressed)]
            active:translate-y-1 active:shadow-[0_5px_0_0_var(--color-primary-pressed)]
            transition-all"
          style={{ minHeight: 80 }}
        >
          <CameraIcon className="w-7 h-7" />
          拍下題目，問一題
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 mt-5">
        <div className="flex-1 rounded-2xl border border-card-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-ink">{todayCount}</p>
          <p className="text-sm text-muted">今天解的題</p>
        </div>
        <div className="flex-1 rounded-2xl border border-card-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-ink">{weekCount}</p>
          <p className="text-sm text-muted">這星期解的題</p>
        </div>
      </div>

      {/* Recent problems */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-ink mb-2">最近解過的題目</h2>
        <div className="rounded-2xl border border-card-border bg-card p-5 text-center">
          <p className="text-sm text-muted">還沒有解過的題目</p>
          <p className="text-xs text-muted mt-1">拍一道題目開始吧！</p>
        </div>
      </div>
    </div>
  );
}
