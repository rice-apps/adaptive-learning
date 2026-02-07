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

export async function POST(request: NextRequest) {
  try {
    const { quizId, studentId, educatorId, dueDate } = await request.json();

    if (!quizId || !studentId || !educatorId || !dueDate) {
      return NextResponse.json(
        { error: "quizId, studentId, educatorId, and dueDate are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // For MVP: just insert a new deadline row (no unique constraint exists)
    const { error } = await supabase.from("Deadlines").insert({
      student: studentId,
      educator: educatorId,
      quiz: quizId,
      deadline: dueDate,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

