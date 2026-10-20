import { useCallback } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const INITIALS = ["ㄅ","ㄆ","ㄇ","ㄈ","ㄉ","ㄊ","ㄋ","ㄌ","ㄍ","ㄎ","ㄏ","ㄐ","ㄑ","ㄒ","ㄓ","ㄔ","ㄕ","ㄖ","ㄗ","ㄘ","ㄙ"];
const MEDIALS = ["ㄧ","ㄨ","ㄩ"];
const FINALS = ["ㄚ","ㄛ","ㄜ","ㄝ","ㄞ","ㄟ","ㄠ","ㄡ","ㄢ","ㄣ","ㄤ","ㄥ","ㄦ"];
const TONES = ["ˊ","ˇ","ˋ","˙"];

const BTN_SIZE = 52;

function ZhuyinButton({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "tone" | "action";
}) {
  let classes = "rounded-xl border font-bold transition-colors active:scale-95 ";
  switch (variant) {
    case "tone":
      classes += "border-pet/50 bg-pet-soft text-pet";
      break;
    case "action":
      classes += "border-card-border bg-bg text-ink";
      break;
    default:
      classes += "border-card-border bg-card text-ink hover:bg-card-border/30 active:bg-card-border/50";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={{
        minWidth: BTN_SIZE,
        minHeight: BTN_SIZE,
        fontSize: 22,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

export default function ZhuyinKeyboard({ value, onChange, disabled = false }: Props) {
  const append = useCallback(
    (ch: string) => {
      onChange(value + ch);
    },
    [value, onChange],
  );

  const handleDelete = useCallback(() => {
    if (!value) return;
    const chars = [...value];
    chars.pop();
    onChange(chars.join(""));
  }, [value, onChange]);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="rounded-2xl border border-card-border bg-card p-3 space-y-2">
      {/* Display */}
      <div
        className="rounded-xl border border-card-border bg-bg px-4 py-3 text-center font-bold text-ink min-h-[48px] flex items-center justify-center"
        style={{ fontSize: 28 }}
      >
        {value || <span className="text-muted/40">注音</span>}
      </div>

      {/* Initials */}
      <div>
        <p className="text-[10px] text-muted mb-1 px-1">聲母</p>
        <div className="flex flex-wrap gap-1.5">
          {INITIALS.map((ch) => (
            <ZhuyinButton key={ch} label={ch} onClick={() => append(ch)} disabled={disabled} />
          ))}
        </div>
      </div>

      {/* Medials */}
      <div>
        <p className="text-[10px] text-muted mb-1 px-1">介音</p>
        <div className="flex flex-wrap gap-1.5">
          {MEDIALS.map((ch) => (
            <ZhuyinButton key={ch} label={ch} onClick={() => append(ch)} disabled={disabled} />
          ))}
        </div>
      </div>

      {/* Finals */}
      <div>
        <p className="text-[10px] text-muted mb-1 px-1">韻母</p>
        <div className="flex flex-wrap gap-1.5">
          {FINALS.map((ch) => (
            <ZhuyinButton key={ch} label={ch} onClick={() => append(ch)} disabled={disabled} />
          ))}
        </div>
      </div>

      {/* Tones + actions */}
      <div className="flex items-center gap-1.5 pt-1">
        <p className="text-[10px] text-muted px-1 shrink-0">聲調</p>
        {TONES.map((ch) => (
          <ZhuyinButton key={ch} label={ch} onClick={() => append(ch)} disabled={disabled} variant="tone" />
        ))}
        <div className="flex-1" />
        <ZhuyinButton label="⌫" onClick={handleDelete} disabled={disabled || !value} variant="action" />
        <ZhuyinButton label="清除" onClick={handleClear} disabled={disabled || !value} variant="action" />
      </div>
    </div>
  );
}
