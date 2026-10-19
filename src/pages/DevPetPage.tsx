import { useState } from "react";
import TiaoTiaoWithAccessories from "../components/pet/TiaoTiaoWithAccessories";
import { ACCESSORIES } from "../lib/accessories";

const POSES = ["sit", "cheer", "head-happy", "head-curious"] as const;

function allSubsets(items: string[]): string[][] {
  if (items.length === 0) return [[]];
  const rest = allSubsets(items.slice(1));
  return [...rest, ...rest.map((s) => [items[0]!, ...s])];
}

export default function DevPetPage() {
  const [showAnimations, setShowAnimations] = useState(false);
  const allIds = ACCESSORIES.map((a) => a.id);
  const combos = allSubsets(allIds);

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <header className="px-4 py-3">
        <h1 className="text-xl font-bold text-ink">跳跳開發預覽</h1>
        <p className="text-sm text-muted">
          {POSES.length} 姿勢 × {combos.length} 配件組合 = {POSES.length * combos.length} 個
        </p>
      </header>

      <div className="px-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={showAnimations}
            onChange={(e) => setShowAnimations(e.target.checked)}
            className="rounded"
          />
          顯示動畫類別名
        </label>
      </div>

      {/* Animation classes preview */}
      {showAnimations && (
        <section className="px-4 mb-6">
          <h2 className="text-base font-bold text-ink mb-2">動畫預覽</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "idle bounce", cls: "pet-bounce" },
              { label: "celebration", cls: "celebration-bounce" },
              { label: "head tilt", cls: "pet-head-tilt" },
              { label: "tail wag", cls: "pet-tail-wag" },
              { label: "bone fly", cls: "bone-fly" },
              { label: "hearts", cls: "hearts-pop" },
            ].map((a) => (
              <div key={a.cls} className="rounded-xl border border-card-border bg-card p-3 text-center">
                <div className={a.cls} style={{ width: 60, height: 72, margin: "0 auto" }}>
                  <TiaoTiaoWithAccessories pose="sit" equipped={[]} className="w-full h-full" />
                </div>
                <p className="text-xs text-muted mt-1">{a.label}</p>
                <p className="text-[10px] font-mono text-muted">.{a.cls}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All pose × accessory combos */}
      {POSES.map((pose) => (
        <section key={pose} className="px-4 mb-6">
          <h2 className="text-base font-bold text-ink mb-2">{pose}</h2>
          <div className="grid grid-cols-4 gap-2">
            {combos.map((combo, i) => (
              <div
                key={i}
                className="rounded-xl border border-card-border bg-card p-2 flex flex-col items-center"
              >
                <div style={{ width: 56, height: pose.startsWith("head") ? 56 : 68 }}>
                  <TiaoTiaoWithAccessories
                    pose={pose}
                    equipped={combo}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-[9px] text-muted mt-1 text-center leading-tight">
                  {combo.length === 0 ? "無" : combo.join("+")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
