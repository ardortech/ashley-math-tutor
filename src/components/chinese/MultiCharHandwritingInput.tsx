import { useRef, useCallback } from "react";
import HandwritingInput from "./HandwritingInput";

interface Props {
  charCount: number;
  value: string[];
  onChange: (chars: string[]) => void;
  disabled?: boolean;
  size?: number;
}

export default function MultiCharHandwritingInput({
  charCount,
  value,
  onChange,
  disabled = false,
  size = 180,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCharChange = useCallback(
    (i: number, ch: string) => {
      const next = [...value];
      next[i] = ch;
      onChange(next);

      if (ch && i < charCount - 1) {
        setTimeout(() => refs.current[i + 1]?.focus(), 50);
      }
    },
    [value, onChange, charCount],
  );

  return (
    <div className="flex items-center gap-4 justify-center">
      {Array.from({ length: charCount }, (_, i) => (
        <div key={i}>
          <HandwritingInput
            value={value[i] ?? ""}
            onChange={(ch) => handleCharChange(i, ch)}
            disabled={disabled}
            size={size}
            autoFocus={i === 0}
            inputRef={{ current: refs.current[i] ?? null } as React.RefObject<HTMLInputElement | null>}
          />
        </div>
      ))}
    </div>
  );
}
