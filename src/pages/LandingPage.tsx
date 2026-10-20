import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import TiaoTiaoWithAccessories from "../components/pet/TiaoTiaoWithAccessories";
import PetActionIcon from "../components/icons/PetActionIcon";
import HeartIcon from "../components/icons/HeartIcon";
import { usePetState } from "../hooks/usePetState";
import { getTodayCount } from "../lib/storage";
import { resolveEquipped, nextThreshold } from "../lib/accessories";
import { getFavoriteCount } from "../lib/favorites";

export default function LandingPage() {
  const navigate = useNavigate();
  const { pet, feedSnack, level, remaining, maxedOut } = usePetState();
  const mathToday = getTodayCount("math");
  const chineseToday = getTodayCount("chinese");
  const [tapReaction, setTapReaction] = useState<string | null>(null);
  const [feedingState, setFeedingState] = useState<"idle" | "flying" | "hearts">("idle");
  const [mathFavCount, setMathFavCount] = useState(0);
  const [chineseFavCount, setChineseFavCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const [mf, cf] = await Promise.all([
        getFavoriteCount("math"),
        getFavoriteCount("chinese"),
      ]);
      setMathFavCount(mf);
      setChineseFavCount(cf);
    })();
  }, []);

  const resolved = resolveEquipped(pet.equippedAccessories);
  const next = nextThreshold(pet.solvedCount);

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

      {/* Pet card */}
      <div className="mt-2 mx-4 rounded-[28px] border border-card-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
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
            {feedingState === "flying" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 bone-fly">
                <img src="/icons/feed-snack-bag.svg" alt="" width={28} height={28} />
              </span>
            )}
            {feedingState === "hearts" && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 hearts-pop text-fix">
                <HeartIcon className="w-6 h-6" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-ink">{pet.name}</p>
            <p className="text-sm text-muted mt-0.5">等級 {level}</p>
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
                  數學和國文答對都算喔！再解 {remaining} 題就升級
                </p>
              </div>
            )}
            {maxedOut && (
              <p className="text-xs text-success mt-2 font-medium">已達最高等級！</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleFeed}
                disabled={pet.snacks === 0 || feedingState !== "idle"}
                className="inline-flex items-center gap-1 rounded-full bg-pet-soft px-3 py-1.5 text-sm font-medium text-pet
                  enabled:hover:bg-pet/20 enabled:active:bg-pet/30 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PetActionIcon src="/icons/feed-snack-bag.svg" label="餵點心" />
                <span className="text-xs text-muted">({pet.snacks})</span>
              </button>
              <button
                onClick={() => navigate("/dress-up")}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary
                  hover:bg-primary/10 active:bg-primary/20 transition-colors"
              >
                <PetActionIcon src="/icons/dress-up-collar.svg" label="換裝" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subject picker */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-ink mb-3">今天要練什麼？</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Math card */}
          <button
            onClick={() => navigate("/math")}
            className="rounded-[24px] border border-card-border bg-card p-4 text-left
              active:bg-card-border/30 transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-primary">÷</span>
            </div>
            <p className="text-base font-bold text-ink">數學</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              拍題目，跳跳一步一步陪你解
            </p>
            <p className="text-xs text-primary font-medium mt-2">
              今天解了 {mathToday} 題
            </p>
          </button>

          {/* Chinese card */}
          <button
            onClick={() => navigate("/chinese")}
            className="rounded-[24px] border border-card-border bg-card p-4 text-left
              active:bg-card-border/30 transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: "var(--color-success-soft, #E2F4E9)" }}
            >
              <span className="text-2xl font-bold" style={{ color: "#1F7A4D" }}>文</span>
            </div>
            <p className="text-base font-bold text-ink">國文</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              改錯字、字音字義每日練習
            </p>
            <p className="text-xs font-medium mt-2" style={{ color: "#1F7A4D" }}>
              今日練習 {chineseToday} / 10 題
            </p>
          </button>
        </div>
      </div>

      {/* Favorites */}
      <div className="px-4 mt-5">
        <div className="rounded-2xl border border-card-border bg-card p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-ink">我的收藏</span>
          <span className="text-sm text-muted">數學 {mathFavCount} 題 · 國文 {chineseFavCount} 題</span>
        </div>
      </div>
    </div>
  );
}
