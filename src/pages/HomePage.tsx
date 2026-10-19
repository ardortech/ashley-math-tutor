import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CameraIcon from "../components/icons/CameraIcon";
import TiaoTiaoHeadHappy from "../components/pet/TiaoTiaoHeadHappy";
import TiaoTiaoWithAccessories from "../components/pet/TiaoTiaoWithAccessories";
import MathText from "../components/MathText";
import { usePetState } from "../hooks/usePetState";
import { getTodayCount, getWeekCount, getProgress, clearProgress } from "../lib/storage";
import { resolveEquipped, nextThreshold } from "../lib/accessories";

export default function HomePage() {
  const navigate = useNavigate();
  const { pet, feedSnack, level, remaining, maxedOut } = usePetState();
  const todayCount = getTodayCount();
  const weekCount = getWeekCount();
  const [progress] = useState(() => getProgress());
  const [showResume, setShowResume] = useState(!!progress);
  const [tapReaction, setTapReaction] = useState<string | null>(null);
  const [feedingState, setFeedingState] = useState<"idle" | "flying" | "hearts">("idle");

  const resolved = resolveEquipped(pet.equippedAccessories);
  const next = nextThreshold(pet.solvedCount);

  const handleResume = () => {
    if (!progress) return;
    setShowResume(false);
    navigate("/guided", {
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

  const handleTap = useCallback(() => {
    if (tapReaction) return;
    const reaction = Math.random() > 0.5 ? "pet-head-tilt" : "pet-tail-wag";
    setTapReaction(reaction);
    setTimeout(() => setTapReaction(null), 600);
  }, [tapReaction]);

  const handleFeed = useCallback(() => {
    if (pet.snacks <= 0 || feedingState !== "idle") return;
    setFeedingState("flying");
    setTimeout(() => {
      feedSnack();
      setFeedingState("hearts");
      setTimeout(() => setFeedingState("idle"), 1000);
    }, 800);
  }, [pet.snacks, feedingState, feedSnack]);

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <Header />

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

      {/* Pet card */}
      <div className="mt-2 mx-4 rounded-[28px] border border-card-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Pet — tappable */}
          <div className="relative shrink-0" style={{ width: 100, height: 120 }}>
            <button
              onClick={handleTap}
              className={`w-full h-full pet-bounce ${tapReaction ?? ""}`}
              aria-label="點一下跳跳"
            >
              <TiaoTiaoWithAccessories
                pose="sit"
                equipped={resolved}
                className="w-full h-full"
              />
            </button>

            {/* Feeding animation overlay */}
            {feedingState === "flying" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl bone-fly">
                🦴
              </span>
            )}
            {feedingState === "hearts" && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xl hearts-pop">
                ❤️
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-ink">{pet.name}</p>
            <p className="text-sm text-muted mt-0.5">等級 {level}</p>

            {/* Progress bar */}
            {!maxedOut && next && (
              <div className="mt-2">
                <div className="h-2.5 rounded-full bg-pet-soft overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pet transition-all duration-500"
                    style={{
                      width: `${Math.max(10, ((next - remaining) / next) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted mt-1">
                  再解 {remaining} 題就升級，解鎖新配件！
                </p>
              </div>
            )}
            {maxedOut && (
              <p className="text-xs text-success mt-2 font-medium">已達最高等級！</p>
            )}

            {/* Feed + Dress-up buttons */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleFeed}
                disabled={pet.snacks === 0 || feedingState !== "idle"}
                className="inline-flex items-center gap-1 rounded-full bg-pet-soft px-3 py-1.5 text-sm font-medium text-pet
                  enabled:hover:bg-pet/20 enabled:active:bg-pet/30 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🦴 餵點心
                <span className="text-xs text-muted">({pet.snacks})</span>
              </button>
              <button
                onClick={() => navigate("/dress-up")}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary
                  hover:bg-primary/10 active:bg-primary/20 transition-colors"
              >
                👕 換裝
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Big capture button */}
      <div className="px-4 mt-6">
        <button
          onClick={() => navigate("/capture")}
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
