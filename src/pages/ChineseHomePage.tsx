import { useNavigate } from "react-router-dom";

export default function ChineseHomePage() {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-ink">國文</h1>
        <span className="text-sm text-muted">康軒 7 上</span>
      </header>

      <div className="px-4 mt-4">
        <div className="rounded-[24px] border border-card-border bg-card p-6 opacity-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#E2F4E9" }}
            >
              <span className="text-2xl font-bold" style={{ color: "#1F7A4D" }}>文</span>
            </div>
            <div>
              <p className="text-lg font-bold text-ink">今日練習</p>
              <p className="text-sm text-muted">改錯字、字音字義每日練習</p>
            </div>
          </div>
          <button
            disabled
            className="w-full rounded-[20px] px-6 py-5 text-lg font-bold text-white
              shadow-[0_8px_0_0_#15633D] transition-all cursor-not-allowed"
            style={{ backgroundColor: "#1F7A4D" }}
          >
            C2 開放
          </button>
        </div>
      </div>
    </div>
  );
}
