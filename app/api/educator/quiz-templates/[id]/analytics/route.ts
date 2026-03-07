import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Check if a quiz's questions match the template's (same set of IDs) */
function questionsMatch(
  templateQuestions: string[],
  quizQuestions: string[] | null
): boolean {
  if (!quizQuestions || quizQuestions.length !== templateQuestions.length)
    return false;
  const setA = new Set(templateQuestions.sort());
  const setB = new Set(quizQuestions.sort());
  if (setA.size !== setB.size) return false;
  for (const id of setA) if (!setB.has(id)) return false;
  return true;
}

/** Compute correctness from result + question (MCQ, free_response, drag_drop only) */
function computeCorrectness(
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

/** Parse "5m 30s" or "1h 2m 3s" to seconds */
function parseTimeSpentToSeconds(s: string | null): number | null {
  if (!s || !s.trim()) return null;
  let total = 0;
  const h = s.match(/(\d+)\s*h/);
  const m = s.match(/(\d+)\s*m/);
  const sec = s.match(/(\d+)\s*s/);
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (sec) total += parseInt(sec[1], 10);
  return total > 0 ? total : null;
}

/** Format seconds to human-readable */
function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    const { data: template, error: templateError } = await serviceSupabase
      .from("Quizzes")
      .select("id, name, questions, educator_id, is_template")
      .eq("id", id)
      .eq("is_template", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.educator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const templateQuestions: string[] = Array.isArray(template.questions)
      ? template.questions
      : [];

    if (templateQuestions.length === 0) {
      return NextResponse.json({
        templateName: template.name,
        assignmentCount: 0,
        submittedCount: 0,
        averageScorePercent: null,
        averageTimeSpent: null,
        questionBreakdown: [],
        worstPerformingQuestion: null,
      });
    }

    // Find all assigned quizzes for this educator (student_id not null)
    const { data: assignedQuizzes, error: quizzesError } = await serviceSupabase
      .from("Quizzes")
      .select("id, questions, student_id, submitted, time_spent, created_at, end_time")
      .eq("educator_id", template.educator_id)
      .not("student_id", "is", null);

    if (quizzesError) {
      return NextResponse.json(
        { error: quizzesError.message },
        { status: 500 }
      );
    }

    const matchingQuizzes = (assignedQuizzes || []).filter((q) =>
      questionsMatch(templateQuestions, q.questions)
    );

    const submittedQuizzes = matchingQuizzes.filter(
      (q) => q.submitted != null && q.submitted !== ""
    );

    if (submittedQuizzes.length === 0) {
      const { data: questions } = await serviceSupabase
        .from("Questions")
        .select("id, question_type, question_details")
        .in("id", templateQuestions);

      const questionMap = new Map(
        (questions || []).map((q: { id: string }) => [q.id, q])
      );
      const breakdown = templateQuestions.map((qid, idx) => {
        const q = questionMap.get(qid) as { question_details?: unknown } | undefined;
        const preview =
          q?.question_details && typeof q.question_details === "object"
            ? ((q.question_details as Record<string, unknown>).question as string) ||
              ((q.question_details as Record<string, unknown>).prompt as string) ||
              "—"
            : "—";
        return {
          questionId: qid,
          order: idx + 1,
          preview: (preview || "—").slice(0, 80) + (String(preview).length > 80 ? "…" : ""),
          correctCount: 0,
          totalAttempts: 0,
          percentCorrect: null,
          mostCommonWrongAnswer: null,
        };
      });

      return NextResponse.json({
        templateName: template.name,
        assignmentCount: matchingQuizzes.length,
        submittedCount: 0,
        averageScorePercent: null,
        averageTimeSpent: null,
        questionBreakdown: breakdown,
        worstPerformingQuestion: null,
      });
    }

    const quizIds = submittedQuizzes.map((q) => q.id);

    const { data: results, error: resultsError } = await serviceSupabase
      .from("Results")
      .select("quiz_id, question_id, student_answer, student_answer_json")
      .in("quiz_id", quizIds);

    if (resultsError) {
      return NextResponse.json(
        { error: resultsError.message },
        { status: 500 }
      );
    }

    const { data: questions, error: questionsError } = await serviceSupabase
      .from("Questions")
      .select("id, question_type, question_details")
      .in("id", templateQuestions);

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }

    type QuestionRow = {
      id: string;
      question_type: string | null;
      question_details: unknown;
    };
    const questionMap = new Map<string, QuestionRow>(
      (questions as QuestionRow[]).map((q) => [q.id, q])
    );

    const rawResults = (results || []) as {
      quiz_id: string;
      question_id: string;
      student_answer: string | null;
      student_answer_json?: unknown;
    }[];

    // Per-question stats
    const byQuestion = new Map<
      string,
      { correct: number; total: number; wrongAnswers: Map<string, number> }
    >();

    for (const qid of templateQuestions) {
      byQuestion.set(qid, {
        correct: 0,
        total: 0,
        wrongAnswers: new Map(),
      });
    }

    let totalScoreNumerator = 0;
    let totalScoreDenominator = 0;

    for (const quizId of quizIds) {
      const quizResults = rawResults.filter((r) => r.quiz_id === quizId);
      let quizCorrect = 0;
      let scorableCount = 0;

      for (const r of quizResults) {
        const q = questionMap.get(r.question_id);
        if (!q || !templateQuestions.includes(r.question_id)) continue;

        const entry = byQuestion.get(r.question_id);
        if (!entry) continue;

        entry.total++;
        const correct = computeCorrectness(r, q);

        if (correct === true) {
          entry.correct++;
          quizCorrect++;
          scorableCount++;
        } else if (correct === false) {
          scorableCount++;
          const wrong = String(r.student_answer || "(blank)").slice(0, 60);
          entry.wrongAnswers.set(
            wrong,
            (entry.wrongAnswers.get(wrong) || 0) + 1
          );
        }
      }

      totalScoreNumerator += quizCorrect;
      totalScoreDenominator += scorableCount;
    }

    const questionBreakdown = templateQuestions.map((qid, idx) => {
      const entry = byQuestion.get(qid)!;
      const q = questionMap.get(qid);
      const details = q?.question_details as Record<string, unknown> | undefined;
      const preview =
        details && typeof details === "object"
          ? ((details as Record<string, unknown>).question as string) ||
            ((details as Record<string, unknown>).prompt as string) ||
            "—"
          : "—";

      let mostCommonWrong: string | null = null;
      let maxCount = 0;
      for (const [ans, count] of entry.wrongAnswers) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonWrong = ans;
        }
      }

      return {
        questionId: qid,
        order: idx + 1,
        preview: (String(preview) || "—").slice(0, 80) + (String(preview).length > 80 ? "…" : ""),
        correctCount: entry.correct,
        totalAttempts: entry.total,
        percentCorrect:
          entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : null,
        mostCommonWrongAnswer: mostCommonWrong,
      };
    });

    const worstPerforming = questionBreakdown
      .filter((q) => q.totalAttempts >= 2 && q.percentCorrect != null)
      .sort((a, b) => (a.percentCorrect ?? 0) - (b.percentCorrect ?? 0))[0] ?? null;

    const averageScorePercent =
      totalScoreDenominator > 0
        ? Math.round((totalScoreNumerator / totalScoreDenominator) * 100)
        : null;

    const timeSeconds = submittedQuizzes
      .map((q) => parseTimeSpentToSeconds(q.time_spent))
      .filter((s): s is number => s != null);

    const averageTimeSpent =
      timeSeconds.length > 0
        ? formatSeconds(
            Math.round(
              timeSeconds.reduce((a, b) => a + b, 0) / timeSeconds.length
            )
          )
        : null;

    return NextResponse.json({
      templateName: template.name,
      assignmentCount: matchingQuizzes.length,
      submittedCount: submittedQuizzes.length,
      averageScorePercent,
      averageTimeSpent,
      questionBreakdown,
      worstPerformingQuestion: worstPerforming,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
