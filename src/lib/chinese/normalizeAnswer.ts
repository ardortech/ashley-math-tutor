export function normalizeAnswer(input: string): string {
  return input
    .replace(/\s+/g, "")
    .replace(/　/g, "")
    .normalize("NFC");
}

export function answersMatch(input: string, expected: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(expected);
}
