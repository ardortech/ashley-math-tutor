import TiaoTiaoSit from "./pet/TiaoTiaoSit";

interface PetCardProps {
  name: string;
  level: number;
  remaining: number;
  maxedOut: boolean;
  snacks: number;
  onFeed: () => void;
}

export default function PetCard({
  name,
  level,
  remaining,
  maxedOut,
  snacks,
  onFeed,
}: PetCardProps) {
  return (
    <div className="mx-4 rounded-[28px] border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Pet */}
        <div className="pet-bounce shrink-0" style={{ width: 100, height: 120 }}>
          <TiaoTiaoSit className="w-full h-full" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-ink">{name}</p>
          <p className="text-sm text-muted mt-0.5">等級 {level}</p>

          {/* Progress bar */}
          {!maxedOut && (
            <div className="mt-2">
              <div className="h-2.5 rounded-full bg-pet-soft overflow-hidden">
                <div
                  className="h-full rounded-full bg-pet transition-all duration-500"
                  style={{
                    width: remaining <= 0 ? "100%" : `${Math.max(10, 100 - remaining * 20)}%`,
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

          {/* Feed button */}
          <button
            onClick={onFeed}
            disabled={snacks === 0}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-pet-soft px-3 py-1.5 text-sm font-medium text-pet
              enabled:hover:bg-pet/20 enabled:active:bg-pet/30 transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🦴 餵點心
            <span className="text-xs text-muted">({snacks})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
