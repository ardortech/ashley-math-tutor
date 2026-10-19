import { useNavigate } from "react-router-dom";
import TiaoTiaoWithAccessories from "../components/pet/TiaoTiaoWithAccessories";
import { usePetState } from "../hooks/usePetState";
import { ACCESSORIES, resolveEquipped } from "../lib/accessories";

export default function DressUpPage() {
  const navigate = useNavigate();
  const { pet, toggleAccessory } = usePetState();

  const resolved = resolveEquipped(pet.equippedAccessories);

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-muted hover:bg-card-border/40 active:bg-card-border/60 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-ink">幫跳跳換裝</h1>
      </header>

      {/* Preview */}
      <div className="flex justify-center px-4 py-4">
        <div style={{ width: 180, height: 220 }}>
          <TiaoTiaoWithAccessories
            pose="sit"
            equipped={resolved}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Accessories grid */}
      <div className="px-4 mt-2">
        <h2 className="text-base font-bold text-ink mb-3">配件</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACCESSORIES.map((acc) => {
            const unlocked = pet.accessories.includes(acc.id);
            const equipped = resolved.includes(acc.id);
            const sameSlot = acc.slot
              ? ACCESSORIES.find(
                  (other) =>
                    other.slot === acc.slot &&
                    other.id !== acc.id &&
                    resolved.includes(other.id),
                )
              : null;

            return (
              <button
                key={acc.id}
                onClick={() => unlocked && toggleAccessory(acc.id)}
                disabled={!unlocked}
                className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all
                  ${equipped
                    ? "border-pet bg-pet-soft"
                    : unlocked
                      ? "border-card-border bg-card hover:border-primary/40"
                      : "border-card-border bg-bg opacity-60 cursor-not-allowed"
                  }`}
              >
                {/* Mini preview */}
                <div style={{ width: 64, height: 64 }}>
                  <TiaoTiaoWithAccessories
                    pose="head-happy"
                    equipped={acc.poses.includes("head") ? [acc.id] : []}
                    className="w-full h-full"
                  />
                </div>

                <span className="text-sm font-bold text-ink">{acc.name}</span>

                {!unlocked && (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm2 6H6V5a2 2 0 1 1 4 0v2z" />
                    </svg>
                    再解 {acc.unlockSolves - pet.solvedCount} 題
                  </span>
                )}

                {equipped && (
                  <span className="text-xs text-pet font-medium">已裝備</span>
                )}

                {unlocked && !equipped && sameSlot && (
                  <span className="text-xs text-muted">
                    和{sameSlot.name}同位置
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
