import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import studentResultManager from "@/domains/api/managers/studentResultManager";
import { computeScorePercent } from "@/lib/quizScore";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const quizzes = await studentResultManager.getQuizzesByStudent(studentId);

    const submittedQuizzes = quizzes.filter((q) => !!q.submitted);
    if (submittedQuizzes.length === 0) {
      return NextResponse.json(
        quizzes.map((q) => ({ ...q, score_percent: null }))
      );
    }

    const quizIds = submittedQuizzes.map((q) => q.id);
    const serviceSupabase = getServiceSupabase();

    const { data: results, error: resultsError } = await serviceSupabase
      .from("Results")
      .select("quiz_id, question_id, student_answer, student_answer_json")
      .in("quiz_id", quizIds);

    if (resultsError) {
      return NextResponse.json(quizzes.map((q) => ({ ...q, score_percent: null })));
    }

    const questionIds = [
      ...new Set((results || []).map((r: { question_id: string }) => r.question_id)),
    ];
    const { data: questions } = await serviceSupabase
      .from("Questions")
      .select("id, question_type, question_details")
      .in("id", questionIds);

    const questionsMap = new Map(
      (questions || []).map((q: { id: string; question_type: string | null; question_details: unknown }) => [
        q.id,
        { question_type: q.question_type, question_details: q.question_details },
      ])
    );

    const scoreByQuiz = new Map<string, number | null>();
    for (const quizId of quizIds) {
      const quizResults = (results || []).filter(
        (r: { quiz_id: string }) => r.quiz_id === quizId
      );
      const percent = computeScorePercent(quizResults, questionsMap);
      scoreByQuiz.set(quizId, percent);
    }

    return NextResponse.json(
      quizzes.map((q) => ({
        ...q,
        score_percent: scoreByQuiz.get(q.id) ?? null,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}