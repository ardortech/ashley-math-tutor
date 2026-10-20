import { useMemo } from "react";
import TiaoTiaoWithAccessories from "./pet/TiaoTiaoWithAccessories";
import MathText from "./MathText";
import { levelFromSolves, nextThreshold, type AccessoryDef } from "../lib/accessories";

interface Props {
  feedback: string;
  snacksEarned: number;
  solvedCount: number;
  equippedAccessories: string[];
  isPartiallyCorrect?: boolean;
  partialErrorLine?: string | null;
  newAccessories?: AccessoryDef[];
  prevLevel?: number;
  newLevel?: number;
  buttons: React.ReactNode;
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ["#F08A24", "#2457C5", "#1F7A4D", "#E74C3C", "#F1C40F", "#8E44AD"];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length]!,
      left: `${4 + (i * 4.1) % 92}%`,
      delay: `${(i * 0.12) % 1.5}s`,
      size: 6 + (i % 4) * 2,
      rotation: (i * 47) % 360,
    }));
  }, []);

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            backgroundColor: p.color,
            width: p.size,
            height: p.size * 1.6,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function CelebrationScreen({
  feedback,
  snacksEarned,
  solvedCount,
  equippedAccessories,
  isPartiallyCorrect,
  partialErrorLine,
  newAccessories,
  prevLevel,
  newLevel,
  buttons,
}: Props) {
  const level = newLevel ?? levelFromSolves(solvedCount);
  const next = nextThreshold(solvedCount);
  const remaining = next !== null ? next - solvedCount : 0;
  const maxedOut = next === null;
  const leveledUp = prevLevel !== undefined && newLevel !== undefined && newLevel > prevLevel;

  return (
    <div className="min-h-dvh bg-pet-celebration pb-8 relative overflow-hidden">
      <Confetti />

      <div className="relative z-10 flex flex-col items-center px-6 pt-8">
        {/* 跳跳 cheer */}
        <div className="celebration-bounce" style={{ width: 160, height: 160 }}>
          <TiaoTiaoWithAccessories
            pose="cheer"
            equipped={equippedAccessories}
            className="w-full h-full"
          />
        </div>

        {/* title */}
        <p className="mt-4 text-2xl font-black text-ink">
          哇！你又解出一題了！
        </p>

        {/* success badge */}
        <div className="mt-3 rounded-full bg-success-soft px-5 py-2">
          <span className="text-success text-lg font-bold">答對了！</span>
        </div>

        {/* feedback */}
        <div className="mt-4 rounded-2xl border border-card-border bg-card px-4 py-3 w-full">
          <MathText
            text={feedback}
            className="text-base text-ink leading-relaxed"
          />
        </div>

        {/* partial-correct warning */}
        {isPartiallyCorrect && partialErrorLine && (
          <div className="mt-3 rounded-2xl border border-fix/30 bg-fix-soft px-4 py-3 w-full">
            <p className="text-sm text-fix font-medium mb-1">有一行可以再注意：</p>
            <MathText text={partialErrorLine} className="text-sm text-ink" />
          </div>
        )}

        {/* snacks earned */}
        {snacksEarned > 0 && (
          <div className="mt-4 rounded-2xl bg-pet-soft px-5 py-3 flex items-center gap-2">
            <img src="/icons/feed-snack-bag.svg" alt="" width={28} height={28} />
            <span className="text-pet font-bold text-lg">
              點心 +{snacksEarned}
            </span>
          </div>
        )}

        {/* level up announcement */}
        {leveledUp && (
          <div className="mt-4 rounded-2xl bg-[#FFF1DC] border-2 border-pet px-5 py-4 w-full text-center celebration-fade-in">
            <p className="text-lg font-black text-pet">
              跳跳升到等級 {newLevel} 了！
            </p>
            {newAccessories && newAccessories.length > 0 && (
              <p className="text-base text-ink mt-1">
                解鎖新配件：{newAccessories.map((a) => a.name).join("、")}
              </p>
            )}
          </div>
        )}

        {/* level progress bar */}
        <div className="mt-4 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-ink">等級 {level}</span>
            {!maxedOut && (
              <span className="text-xs text-muted">
                再解 {remaining} 題升級
              </span>
            )}
            {maxedOut && (
              <span className="text-xs text-success font-medium">最高等級！</span>
            )}
          </div>
          <div className="h-3 rounded-full bg-pet-soft overflow-hidden">
            <div
              className="h-full rounded-full bg-pet transition-all duration-700"
              style={{
                width: maxedOut
                  ? "100%"
                  : `${Math.max(8, ((next! - remaining) / next!) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* action buttons */}
        <div className="mt-6 w-full space-y-3">{buttons}</div>
      </div>
    </div>
  );
}
