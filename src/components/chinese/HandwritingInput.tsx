import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  size?: number;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

function extractLastChinese(text: string, max: number): string {
  const chars = [...text].filter((ch) => /\p{Script=Han}/u.test(ch));
  return chars.slice(-max).join("");
}

export default function HandwritingInput({
  value,
  onChange,
  disabled = false,
  size = 180,
  autoFocus = false,
  inputRef: externalRef,
}: Props) {
  const internalRef = useRef<HTMLInputElement>(null);
  const ref = externalRef ?? internalRef;
  const [composing, setComposing] = useState(false);
  const [rawValue, setRawValue] = useState(value);

  useEffect(() => {
    if (!composing) {
      setRawValue(value);
    }
  }, [value, composing]);

  const handleCompositionStart = useCallback(() => {
    setComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      setComposing(false);
      const final = extractLastChinese(e.currentTarget.value, 1);
      setRawValue(final);
      onChange(final);
    },
    [onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (composing) {
        setRawValue(v);
        return;
      }
      const final = extractLastChinese(v, 1);
      setRawValue(final);
      onChange(final);
    },
    [composing, onChange],
  );

  const handleClear = useCallback(() => {
    setRawValue("");
    onChange("");
    ref.current?.focus();
  }, [onChange, ref]);

  const bgSize = size;
  const half = bgSize / 2;
  const bgImage = [
    `linear-gradient(to right, #CBD5E1 1px, transparent 1px)`,
    `linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)`,
    `linear-gradient(45deg, transparent calc(50% - 0.5px), #E2E8F0 calc(50% - 0.5px), #E2E8F0 calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
    `linear-gradient(-45deg, transparent calc(50% - 0.5px), #E2E8F0 calc(50% - 0.5px), #E2E8F0 calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
  ].join(", ");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: bgSize, height: bgSize }}>
        <input
          ref={ref}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={rawValue}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="w-full h-full border-2 border-ink/30 rounded-xl text-center
            focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
          style={{
            fontSize: size * 0.5,
            fontFamily: "'Noto Sans TC', sans-serif",
            lineHeight: 1,
            backgroundImage: bgImage,
            backgroundSize: `${half}px ${half}px`,
            backgroundPosition: `${half}px ${half}px, ${half}px ${half}px, 0 0, 0 0`,
            backgroundRepeat: "no-repeat",
            backgroundColor: "white",
            caretColor: "var(--color-primary)",
          }}
        />
      </div>
      {value && !disabled && (
        <button
          onClick={handleClear}
          type="button"
          className="text-sm text-muted hover:text-fix transition-colors"
        >
          清除重寫
        </button>
      )}
    </div>
  );
}
