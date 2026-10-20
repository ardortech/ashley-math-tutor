import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  getTextbook,
  saveTextbook,
  createBackup,
  restoreBackup,
  getSolveLog,
  getTodayCount,
  getWeekCount,
  type Textbook,
  type BackupPayload,
  type Subject,
} from "../lib/storage";
import { levelFromSolves } from "../lib/accessories";

const TEXTBOOK_OPTIONS: Textbook[] = ["康軒", "南一", "翰林"];

const SolveEntrySchema = z.object({
  date: z.string(),
  topic: z.string(),
  usedHints: z.boolean(),
  subject: z.enum(["math", "chinese"]).optional(),
});

const BackupSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  pet: z.object({
    schemaVersion: z.literal(1),
    name: z.string(),
    solvedCount: z.number().int().min(0),
    snacks: z.number().int().min(0),
    accessories: z.array(z.string()),
    equippedAccessories: z.array(z.string()),
  }),
  solveLog: z.array(SolveEntrySchema),
  scoredProblemIds: z.array(z.string()),
  textbook: z.enum(["康軒", "南一", "翰林"]).optional().default("康軒"),
  exportedAt: z.string().optional(),
});

function encodeBackup(data: BackupPayload): string {
  const json = JSON.stringify(data);
  try {
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return json;
  }
}

function decodeBackup(code: string): BackupPayload | null {
  let json: string;
  try {
    json = decodeURIComponent(escape(atob(code.trim())));
  } catch {
    json = code.trim();
  }
  try {
    const parsed = BackupSchema.parse(JSON.parse(json));
    return parsed as BackupPayload;
  } catch { /* ignore */ }
  return null;
}

const SUBJECTS: { key: Subject; label: string }[] = [
  { key: "math", label: "數學" },
  { key: "chinese", label: "國文" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [textbook, setTextbook] = useState<Textbook>(getTextbook);
  const [backupCode, setBackupCode] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [restoreInput, setRestoreInput] = useState("");
  const [restorePreview, setRestorePreview] = useState<BackupPayload | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [recordsTab, setRecordsTab] = useState<Subject>("math");
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextbookChange = (val: Textbook) => {
    setTextbook(val);
    saveTextbook(val);
  };

  const handleBackup = useCallback(() => {
    const data = createBackup();
    const code = encodeBackup(data);
    setBackupCode(code);
    setCopyMsg("");
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(backupCode);
      setCopyMsg("已複製！");
    } catch {
      textareaRef.current?.select();
      setCopyMsg("請手動複製上方的文字");
    }
    setTimeout(() => setCopyMsg(""), 3000);
  }, [backupCode]);

  const handleDownload = useCallback(() => {
    const data = createBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiaotiao-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const tryParse = useCallback((text: string) => {
    setRestoreInput(text);
    setRestoreError("");
    setRestorePreview(null);
    setRestoreSuccess(false);
    if (!text.trim()) return;
    const parsed = decodeBackup(text);
    if (parsed) {
      setRestorePreview(parsed);
    } else {
      setRestoreError("這個備份碼好像不完整，再複製一次試試看");
    }
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        tryParse(reader.result);
      }
    };
    reader.readAsText(file);
  }, [tryParse]);

  const handleRestore = useCallback(() => {
    if (!restorePreview) return;
    restoreBackup(restorePreview);
    setRestoreSuccess(true);
    setRestoreInput("");
    setRestorePreview(null);
  }, [restorePreview]);

  const solveLog = getSolveLog();
  const subjectLog = solveLog.filter(
    (e) => (e.subject ?? "math") === recordsTab,
  );

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
        <h1 className="text-xl font-bold text-ink">設定</h1>
      </header>

      <div className="px-4 space-y-6">
        {/* Learning records */}
        <section className="rounded-2xl border border-card-border bg-card p-4">
          <h2 className="text-base font-bold text-ink mb-3">學習紀錄</h2>
          <div className="flex gap-2 mb-3">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setRecordsTab(s.key)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors
                  ${recordsTab === s.key
                    ? "bg-primary text-white"
                    : "bg-bg border border-card-border text-ink hover:bg-card-border/30"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-bg p-3 text-center">
              <p className="text-xl font-bold text-ink">{getTodayCount(recordsTab)}</p>
              <p className="text-xs text-muted">今天</p>
            </div>
            <div className="flex-1 rounded-xl bg-bg p-3 text-center">
              <p className="text-xl font-bold text-ink">{getWeekCount(recordsTab)}</p>
              <p className="text-xs text-muted">本週</p>
            </div>
            <div className="flex-1 rounded-xl bg-bg p-3 text-center">
              <p className="text-xl font-bold text-ink">{subjectLog.length}</p>
              <p className="text-xs text-muted">總共</p>
            </div>
          </div>
        </section>

        {/* Textbook */}
        <section className="rounded-2xl border border-card-border bg-card p-4">
          <h2 className="text-base font-bold text-ink mb-2">課本版本</h2>
          <p className="text-sm text-muted mb-3">跳跳出的練習題會參考這個版本的課本</p>
          <div className="flex gap-2">
            {TEXTBOOK_OPTIONS.map((tb) => (
              <button
                key={tb}
                onClick={() => handleTextbookChange(tb)}
                className={`flex-1 rounded-xl py-3 text-base font-medium transition-colors
                  ${textbook === tb
                    ? "bg-primary text-white"
                    : "bg-bg border border-card-border text-ink hover:bg-card-border/30"
                  }`}
              >
                {tb}
              </button>
            ))}
          </div>
        </section>

        {/* Backup */}
        <section className="rounded-2xl border border-card-border bg-card p-4">
          <h2 className="text-base font-bold text-ink mb-2">備份跳跳</h2>
          <p className="text-sm text-muted mb-3">
            把跳跳的資料（等級、解題記錄、點心數）備份起來，換裝置時可以還原
          </p>

          <button
            onClick={handleBackup}
            className="w-full rounded-xl bg-primary-soft text-primary font-bold py-3 text-base
              active:bg-primary/10 transition-colors"
          >
            產生備份碼
          </button>

          {backupCode && (
            <div className="mt-3">
              <textarea
                ref={textareaRef}
                readOnly
                value={backupCode}
                className="w-full rounded-xl border border-card-border bg-bg p-3 text-xs text-ink font-mono h-24 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 rounded-xl bg-primary text-white font-bold py-2.5 text-sm transition-colors"
                >
                  複製備份碼
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 rounded-xl border border-card-border bg-bg text-ink font-bold py-2.5 text-sm
                    active:bg-card-border/30 transition-colors"
                >
                  下載 .json
                </button>
              </div>
              {copyMsg && (
                <p className="text-sm text-success font-medium mt-2 text-center">{copyMsg}</p>
              )}
            </div>
          )}
        </section>

        {/* Restore */}
        <section className="rounded-2xl border border-card-border bg-card p-4">
          <h2 className="text-base font-bold text-ink mb-2">還原跳跳</h2>
          <p className="text-sm text-muted mb-3">貼上備份碼或選擇備份檔案</p>

          <textarea
            value={restoreInput}
            onChange={(e) => tryParse(e.target.value)}
            placeholder="在這裡貼上備份碼…"
            className="w-full rounded-xl border border-card-border bg-bg p-3 text-sm text-ink h-24 resize-none
              placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="mt-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-primary font-medium"
            >
              或選擇檔案…
            </button>
          </div>

          {restoreError && (
            <p className="mt-3 text-sm text-fix font-medium">{restoreError}</p>
          )}

          {restorePreview && (
            <div className="mt-3 rounded-xl bg-pet-soft p-3">
              <p className="text-sm font-bold text-ink mb-1">備份預覽</p>
              <p className="text-sm text-muted">
                等級：{levelFromSolves(restorePreview.pet.solvedCount)}
              </p>
              <p className="text-sm text-muted">
                已解題數：{restorePreview.pet.solvedCount}
              </p>
              <p className="text-sm text-muted">
                點心數：{restorePreview.pet.snacks}
              </p>
              <p className="text-sm text-muted">
                解題記錄：{restorePreview.solveLog.length} 筆
              </p>
              <p className="text-xs text-fix mt-2 font-medium">
                還原會覆蓋目前的所有資料
              </p>
              <button
                onClick={handleRestore}
                className="mt-3 w-full rounded-xl bg-fix text-white font-bold py-3 text-base transition-colors"
              >
                確認還原
              </button>
            </div>
          )}

          {restoreSuccess && (
            <p className="mt-3 text-sm text-success font-bold text-center">
              還原成功！重新整理後就會看到了
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
