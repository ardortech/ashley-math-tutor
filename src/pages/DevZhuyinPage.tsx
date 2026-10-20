import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ZhuyinKeyboard from "../components/chinese/ZhuyinKeyboard";

export default function DevZhuyinPage() {
  const [searchParams] = useSearchParams();
  const isDev = searchParams.get("dev") === "1";
  const [value, setValue] = useState("");

  if (!isDev) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">加 ?dev=1 才能看到</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-8">
      <header className="px-4 py-3">
        <h1 className="text-xl font-bold text-ink">注音鍵盤測試</h1>
        <p className="text-sm text-muted mt-1">測試注音輸入元件</p>
      </header>

      <div className="px-4 mt-4">
        <div className="rounded-2xl border border-card-border bg-card p-4 mb-4">
          <p className="text-sm text-muted mb-2">目前輸入</p>
          <p className="text-3xl font-bold text-ink text-center min-h-[48px]">
            {value || "—"}
          </p>
        </div>

        <ZhuyinKeyboard value={value} onChange={setValue} />

        <div className="mt-4 text-center">
          <button
            onClick={() => setValue("")}
            className="text-sm text-primary font-medium underline underline-offset-2"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
