import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import quizResultManager from "@/domains/api/managers/quizResultManager";
import { computeCorrectness, computeScorePercent } from "@/lib/quizScore";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET /api/student/quiz-results/[quizId]
// Returns quiz results for a student to view their own submitted quiz.
// Verifies the quiz belongs to the authenticated student.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    const { data: quiz, error: quizError } = await serviceSupabase
      .from("Quizzes")
      .select("id, student_id, submitted")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.student_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const results = await quizResultManager.getQuizResults(quizId);

    const questionsMap = new Map<
      string,
      { question_type: string | null; question_details: unknown }
    >();
    for (const r of results) {
      if (r.question_id) {
        questionsMap.set(
          r.question_id,
          r.question_info
            ? {
                question_type: r.question_info.question_type,
                question_details: r.question_info.question_details,
              }
            : { question_type: null, question_details: null }
        );
      }
    }

    const enrichedResults = results.map((r) => {
      const resultWithJson = r as typeof r & { student_answer_json?: unknown };
      const question = questionsMap.get(r.question_id!);
      const isCorrect = question
        ? computeCorrectness(
            {
              student_answer: r.student_answer,
              student_answer_json: resultWithJson.student_answer_json,
            },
            question
          )
        : null;
      return {
        ...r,
        is_correct: isCorrect,
      };
    });

    const scorePercent = computeScorePercent(
      results
        .filter((r): r is typeof r & { question_id: string } => !!r.question_id)
        .map((r) => ({
          question_id: r.question_id,
          student_answer: r.student_answer,
          student_answer_json: (r as typeof r & { student_answer_json?: unknown })
            .student_answer_json,
        })),
      questionsMap
    );

    return NextResponse.json({
      results: enrichedResults,
      score_percent: scorePercent,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
