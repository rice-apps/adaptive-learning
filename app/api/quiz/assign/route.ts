import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseURL || !supabaseKEY) {
    throw new Error("Supabase env vars not configured");
  }

  return createClient(supabaseURL, supabaseKEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// POST: clone an existing quiz's questions for a new student assignment
export async function POST(request: NextRequest) {
  try {
    const { quizId, studentId, educatorId, dueDate } = await request.json();

    if (!quizId || !studentId || !educatorId) {
      return NextResponse.json(
        { error: "quizId, studentId, and educatorId are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Fetch source quiz as a "template"
    const { data: sourceQuiz, error: sourceErr } = await supabase
      .from("Quizzes")
      .select("id, questions, educator_id")
      .eq("id", quizId)
      .single();

    if (sourceErr || !sourceQuiz) {
      return NextResponse.json(
        { error: sourceErr?.message || "Source quiz not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(sourceQuiz.questions) || sourceQuiz.questions.length === 0) {
      return NextResponse.json(
        { error: "Source quiz has no questions" },
        { status: 400 }
      );
    }

    // Create new quiz row for student assignment
    const { data: newQuiz, error: insertErr } = await supabase
      .from("Quizzes")
      .insert({
        questions: sourceQuiz.questions,
        educator_id: educatorId,
        student_id: studentId,
        submitted: null,
        start_time: null,
        end_time: null,
        time_spent: null,
      })
      .select("id, created_at, questions, educator_id, student_id")
      .single();

    if (insertErr || !newQuiz) {
      return NextResponse.json(
        { error: insertErr?.message || "Failed to assign quiz" },
        { status: 500 }
      );
    }

    // Optional due date via Deadlines table
    if (dueDate) {
      await supabase.from("Deadlines").insert({
        student: studentId,
        educator: educatorId,
        quiz: newQuiz.id,
        deadline: dueDate,
      });
    }

    return NextResponse.json({ success: true, quiz: newQuiz });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET: list pending assigned quizzes for a student (used by older dashboard client)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: quizzes, error: qErr } = await supabase
      .from("Quizzes")
      .select("id, questions, created_at, submitted")
      .eq("student_id", studentId)
      .is("submitted", null)
      .order("created_at", { ascending: false });

    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    const quizIds = (quizzes || []).map((q: any) => q.id);
    const dueByQuizId: Record<string, string | null> = {};

    if (quizIds.length > 0) {
      const { data: deadlines } = await supabase
        .from("Deadlines")
        .select("quiz, deadline")
        .in("quiz", quizIds);

      for (const d of deadlines || []) {
        if (d.quiz && d.deadline) dueByQuizId[d.quiz] = d.deadline;
      }
    }

    const shaped = (quizzes || []).map((q: any) => ({
      id: q.id,
      questions: q.questions || [],
      created_at: q.created_at,
      due_date: dueByQuizId[q.id] ?? null,
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

