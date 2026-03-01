/**
 * Compute whether a result is correct given the question type and details.
 * Returns null for ged_extended_response (not auto-scored) or when correctness cannot be determined.
 */
export function computeCorrectness(
  result: { student_answer: string | null; student_answer_json?: unknown },
  question: { question_type: string | null; question_details: unknown }
): boolean | null {
  if (question.question_type === "ged_extended_response") return null;
  const details =
    typeof question.question_details === "string"
      ? JSON.parse(question.question_details)
      : (question.question_details as Record<string, unknown>);

  if (question.question_type === "drag_drop") {
    const correctAnswers = ((details?.qa_pairs as { answer: string }[]) || []).map(
      (p) => p.answer
    );
    let arr: unknown[] | null = null;
    if (Array.isArray(result.student_answer_json)) arr = result.student_answer_json;
    else if (typeof result.student_answer === "string") {
      try {
        const parsed = JSON.parse(result.student_answer);
        if (Array.isArray(parsed)) arr = parsed;
      } catch {
        // ignore
      }
    }
    if (!arr || arr.length !== correctAnswers.length) return false;
    return arr.every((v, i) => String(v) === String(correctAnswers[i]));
  }

  const correct =
    (details?.answer as string) ?? (details?.correct_answer as string);
  if (correct == null || correct === "") return null;
  return String(result.student_answer) === String(correct);
}

/** Compute score percent (0-100) for a set of results, excluding ged_extended_response. */
export function computeScorePercent(
  results: Array<{ question_id: string; student_answer: string | null; student_answer_json?: unknown }>,
  questionsMap: Map<string, { question_type: string | null; question_details: unknown }>
): number | null {
  let correct = 0;
  let scorable = 0;
  for (const r of results) {
    const q = questionsMap.get(r.question_id);
    if (!q) continue;
    const isCorrect = computeCorrectness(r, q);
    if (isCorrect === true) {
      correct++;
      scorable++;
    } else if (isCorrect === false) {
      scorable++;
    }
    // ged_extended_response: isCorrect is null, don't count
  }
  if (scorable === 0) return null;
  return Math.round((correct / scorable) * 100);
}
