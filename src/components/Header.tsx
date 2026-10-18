import SettingsIcon from "./icons/SettingsIcon";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <h1 className="text-xl font-bold text-ink">數學小老師</h1>
      <button
        className="rounded-full p-2 text-muted hover:bg-card-border/40 active:bg-card-border/60 transition-colors"
        aria-label="設定"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </header>
  );
}
