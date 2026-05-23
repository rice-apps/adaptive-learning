/**
 * Normalize a free-response answer so that minor formatting differences
 * don't mark a correct answer wrong.
 *
 * Handles:
 *  - "6"  vs  "x = 6"       → both become "6"
 *  - "4"  vs  "4 cups"      → both become "4"
 *  - "60" vs  "60 mph"      → both become "60"
 *  - "x<=6" vs "x ≤ 6"     → both become "x≤6"
 *  - "x>=6" vs "x ≥ 6"     → both become "x≥6"
 *  - case and whitespace differences
 */
export function normalizeAnswer(raw: string): string {
  let s = raw.trim().toLowerCase();

  // Normalize inequality symbols before removing spaces
  s = s.replace(/<=/g, "≤").replace(/>=/g, "≥");

  // Remove all whitespace
  s = s.replace(/\s+/g, "");

  // If it looks like "var=value" (pure equation, no inequality), strip the "var=" part
  // so "x=6" and "6" both become "6"
  if (/^[a-z]=/.test(s) && !/[<>≤≥]/.test(s)) {
    s = s.replace(/^[a-z]=/, "");
  }

  // Strip trailing unit labels (letters/slashes after the last digit)
  // "4cups" → "4",  "60mph" → "60",  "x≤4cups" → "x≤4"
  s = s.replace(/(\d)[a-z][a-z/]*$/, "$1");

  return s;
}

/**
 * Returns a format hint string for inequality answers, so the student knows
 * what format to type in. Returns null for non-inequality answers.
 *
 * Example: "x ≤ 6"  →  "Answer in format: x ≤ [value]"
 */
export function getInequalityHint(correctAnswer: string): string | null {
  const s = correctAnswer.trim();
  // Match patterns like: x <= 6,  x ≤ 6,  x >= -3,  x > 4, etc.
  const match = s.match(/^([a-zA-Z])\s*(<=|>=|≤|≥|<|>)\s*/);
  if (!match) return null;

  const variable = match[1];
  let symbol = match[2];
  if (symbol === "<=") symbol = "≤";
  if (symbol === ">=") symbol = "≥";

  return `Answer in format: ${variable} ${symbol} [value]   (e.g. ${variable} ${symbol} 5)`;
}
