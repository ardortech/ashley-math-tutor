import { useState } from "react";
import { savePin } from "../lib/storage";
import TiaoTiaoHeadHappy from "./pet/TiaoTiaoHeadHappy";

interface PinScreenProps {
  onSuccess: () => void;
}

export default function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError("");

    try {
      const headers = new Headers();
      headers.set("x-app-pin", pin.trim());
      const res = await fetch("/api/health", { headers });

      if (res.ok) {
        savePin(pin.trim());
        onSuccess();
      } else {
        setError("PIN 不對，再試一次");
      }
    } catch {
      setError("無法連線，請檢查網路");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <TiaoTiaoHeadHappy className="w-24 h-24" />
        </div>

        <h1 className="text-2xl font-bold text-ink text-center mb-2">
          跳跳小老師
        </h1>
        <p className="text-muted text-center mb-8">請輸入 PIN 碼</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full rounded-2xl border border-card-border bg-card px-4 py-4 text-center text-2xl tracking-[0.3em]
              text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {error && (
            <p className="text-fix text-center text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-white
              shadow-[0_8px_0_0_var(--color-primary-pressed)]
              active:translate-y-1 active:shadow-[0_4px_0_0_var(--color-primary-pressed)]
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "驗證中…" : "進入"}
          </button>
        </form>
      </div>
    </div>
  );
}
