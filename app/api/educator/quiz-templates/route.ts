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

// GET /api/educator/quiz-templates
// Returns all named quiz templates created by the authenticated educator
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    // Get all templates (is_template=true) for this educator
    const { data: templates, error } = await serviceSupabase
      .from("Quizzes")
      .select("id, name, questions, created_at, is_template")
      .eq("educator_id", user.id)
      .eq("is_template", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each template, count how many times it's been assigned
    // (assigned quizzes share the same question set; we track by matching questions array)
    // Also enrich with subject coverage from the Questions table
    const enriched = await Promise.all(
      (templates || []).map(async (t) => {
        let subjects: string[] = [];
        let topics: string[] = [];

        if (t.questions && t.questions.length > 0) {
          const { data: qData } = await serviceSupabase
            .from("Questions")
            .select("subject, topic")
            .in("id", t.questions);

          if (qData) {
            subjects = [...new Set(qData.map((q: any) => q.subject).filter(Boolean))];
            topics = [...new Set(qData.map((q: any) => q.topic).filter(Boolean))];
          }
        }

        return {
          ...t,
          question_count: t.questions?.length ?? 0,
          subjects,
          topics,
        };
      })
    );

    return NextResponse.json({ templates: enriched });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/educator/quiz-templates
// Creates a new named quiz template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { name, questions } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Quiz name is required" }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();

    const { data, error } = await serviceSupabase
      .from("Quizzes")
      .insert({
        name: name.trim(),
        questions,
        educator_id: user.id,
        student_id: null,
        is_template: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
