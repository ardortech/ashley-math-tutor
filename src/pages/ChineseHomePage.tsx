import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTodaySessionProgress } from "../lib/chinese/dailySession";
import { getChoiceTypeStats } from "../lib/chinese/questionBank";
import { getAllRecords } from "../lib/chinese/answerRecord";
import { getAdminMode, isAdminUrl } from "../lib/chinese/dailySession";
import type { ChoiceType } from "../lib/chinese/schema";

export default function ChineseHomePage() {
  const navigate = useNavigate();
  const sessionProgress = getTodaySessionProgress();
  const showAdmin = isAdminUrl();
  const includeUnverified = getAdminMode();
  const typeStats = getChoiceTypeStats(includeUnverified);

  const [accuracyMap, setAccuracyMap] = useState<Record<ChoiceType, number | null>>({
    reading_choice: null,
    meaning_choice: null,
  });

  useEffect(() => {
    void (async () => {
      const records = await getAllRecords();
      const byType: Record<string, { seen: number; wrong: number }> = {};
      for (const r of records) {
        const qId = r.questionId;
        const type = qId.startsWith("rd-") ? "reading_choice"
          : qId.startsWith("mn-") ? "meaning_choice"
          : null;
        if (!type) continue;
        if (!byType[type]) byType[type] = { seen: 0, wrong: 0 };
        byType[type].seen += r.timesSeen;
        byType[type].wrong += r.timesWrong;
      }
      setAccuracyMap({
        reading_choice: byType["reading_choice"]?.seen
          ? Math.round(((byType["reading_choice"].seen - byType["reading_choice"].wrong) / byType["reading_choice"].seen) * 100)
          : null,
        meaning_choice: byType["meaning_choice"]?.seen
          ? Math.round(((byType["meaning_choice"].seen - byType["meaning_choice"].wrong) / byType["meaning_choice"].seen) * 100)
          : null,
      });
    })();
  }, []);

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

      {/* Daily practice card */}
      <div className="px-4 mt-2">
        <div className="rounded-[24px] border-2 border-success/30 bg-success-soft p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-success">文</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-ink">今日練習</p>
              {sessionProgress.completed ? (
                <p className="text-sm text-success font-medium">今天的練習完成了！</p>
              ) : sessionProgress.done > 0 ? (
                <p className="text-sm text-muted">
                  已完成 {sessionProgress.done} / {sessionProgress.total} 題
                </p>
              ) : (
                <p className="text-sm text-muted">
                  字音、字義每日 10 題
                </p>
              )}
            </div>
          </div>

          {sessionProgress.done > 0 && !sessionProgress.completed && (
            <div className="h-2 rounded-full bg-white/50 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${(sessionProgress.done / sessionProgress.total) * 100}%` }}
              />
            </div>
          )}

          <button
            onClick={() => navigate("/chinese/daily")}
            className="w-full rounded-[20px] px-6 py-5 text-lg font-bold text-white
              shadow-[0_8px_0_0_#15633D]
              active:translate-y-1 active:shadow-[0_4px_0_0_#15633D]
              transition-all"
            style={{ backgroundColor: "#1F7A4D" }}
          >
            {sessionProgress.completed
              ? "再練 10 題"
              : sessionProgress.done > 0
                ? "繼續練習"
                : "開始練習"}
          </button>
        </div>
      </div>

      {/* Practice by type */}
      <div className="px-4 mt-5">
        <h2 className="text-base font-bold text-ink mb-3">練某一種題型</h2>
        <div className="space-y-2">
          {(["reading_choice", "meaning_choice"] as const).map((type) => {
            const stat = typeStats[type];
            const acc = accuracyMap[type];
            return (
              <button
                key={type}
                onClick={() => navigate(`/chinese/daily?type=${type}`)}
                disabled={stat.total === 0}
                className="w-full rounded-2xl border border-card-border bg-card p-4 flex items-center justify-between
                  active:bg-card-border/30 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-ink">{stat.label}</span>
                  <span className="text-xs text-muted">{stat.total} 題</span>
                </div>
                <div className="flex items-center gap-2">
                  {acc !== null && (
                    <span className="text-sm text-success font-medium">
                      答對率 {acc}%
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming soon */}
      <div className="px-4 mt-5 space-y-2">
        {["錯題本", "選課次"].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-card-border bg-card p-4 flex items-center justify-between opacity-50"
          >
            <span className="text-base font-medium text-ink">{label}</span>
            <span className="text-xs text-muted rounded-full bg-bg px-3 py-1">即將推出</span>
          </div>
        ))}
      </div>

      {/* Admin notice */}
      {showAdmin && (
        <div className="px-4 mt-4">
          <p className="text-xs text-muted text-center">
            管理員模式可用 — 在設定頁開啟「包含未審核題目」
          </p>
        </div>
      )}
    </div>
  );
}
