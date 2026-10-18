import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
}

function renderSegments(text: string): (string | { html: string })[] {
  const segments: (string | { html: string })[] = [];
  const regex = /\$([^$]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      segments.push(text.slice(last, match.index));
    }
    try {
      segments.push({
        html: katex.renderToString(match[1]!, { throwOnError: false, output: "htmlAndMathml" }),
      });
    } catch {
      segments.push(match[0]);
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    segments.push(text.slice(last));
  }

  return segments;
}

export default function MathText({ text, className }: MathTextProps) {
  const segments = renderSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <span key={i}>{seg}</span>
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
        ),
      )}
    </span>
  );
}
