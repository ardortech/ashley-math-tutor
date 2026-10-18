import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import PetCard from "../components/PetCard";
import CameraIcon from "../components/icons/CameraIcon";
import { usePetState } from "../hooks/usePetState";
import { getTodayCount, getWeekCount } from "../lib/storage";

export default function HomePage() {
  const navigate = useNavigate();
  const { pet, feedSnack, level, remaining, maxedOut } = usePetState();
  const todayCount = getTodayCount();
  const weekCount = getWeekCount();

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <Header />

      {/* Pet card */}
      <div className="mt-2">
        <PetCard
          name={pet.name}
          level={level}
          remaining={remaining}
          maxedOut={maxedOut}
          snacks={pet.snacks}
          onFeed={feedSnack}
        />
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
