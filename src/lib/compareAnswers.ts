function stripPrefix(s: string): string {
  return s
    .trim()
    .replace(/^[a-zA-Z]\s*[=＝]\s*/, "")
    .replace(/^答[：:]\s*/, "")
    .trim();
}

function toFraction(s: string): { num: number; den: number } | null {
  const cleaned = s.replace(/\s/g, "");

  const fracMatch = cleaned.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1]!, 10);
    const den = parseInt(fracMatch[2]!, 10);
    if (den === 0) return null;
    return { num, den };
  }

  const decMatch = cleaned.match(/^-?\d+\.\d+$/);
  if (decMatch) {
    const val = parseFloat(cleaned);
    if (!isFinite(val)) return null;
    const parts = cleaned.split(".");
    const decimals = parts[1]?.length ?? 0;
    const den = Math.pow(10, decimals);
    const num = Math.round(val * den);
    return { num, den };
  }

  const intMatch = cleaned.match(/^-?\d+$/);
  if (intMatch) {
    return { num: parseInt(cleaned, 10), den: 1 };
  }

  return null;
}

function fractionsEqual(
  a: { num: number; den: number },
  b: { num: number; den: number },
): boolean {
  return a.num * b.den === b.num * a.den;
}

export function compareAnswers(
  a: string,
  b: string,
): "equal" | "different" | "unknown" {
  const cleanA = stripPrefix(a);
  const cleanB = stripPrefix(b);

  if (!cleanA || !cleanB) return "unknown";

  const fracA = toFraction(cleanA);
  const fracB = toFraction(cleanB);

  if (fracA && fracB) {
    return fractionsEqual(fracA, fracB) ? "equal" : "different";
  }

  const normA = cleanA.replace(/\s/g, "").toLowerCase();
  const normB = cleanB.replace(/\s/g, "").toLowerCase();

  if (normA === normB) return "equal";

  return "unknown";
}
