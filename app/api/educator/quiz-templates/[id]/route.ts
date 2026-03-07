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

// GET /api/educator/quiz-templates/[id]
// Returns template with full question data (for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.educator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let questions: any[] = [];
    if (template.questions?.length > 0) {
      const { data: qs } = await serviceSupabase
        .from("Questions")
        .select("*")
        .in("id", template.questions);
      questions = (template.questions as string[]).map(
        (qid: string) => qs?.find((q: any) => q.id === qid)
      ).filter(Boolean);
    }

    return NextResponse.json({ template, questions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/educator/quiz-templates/[id]
// Update a template's name and/or questions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: "Quiz name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.questions !== undefined) {
      if (!Array.isArray(body.questions) || body.questions.length === 0) {
        return NextResponse.json({ error: "Questions array cannot be empty" }, { status: 400 });
      }
      updates.questions = body.questions;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const serviceSupabase = getServiceSupabase();

    // Verify this template belongs to the educator
    const { data: existing } = await serviceSupabase
      .from("Quizzes")
      .select("id, educator_id")
      .eq("id", id)
      .eq("is_template", true)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existing.educator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data, error } = await serviceSupabase
      .from("Quizzes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/educator/quiz-templates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabase();

    // Verify ownership
    const { data: existing } = await serviceSupabase
      .from("Quizzes")
      .select("id, educator_id")
      .eq("id", id)
      .eq("is_template", true)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existing.educator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await serviceSupabase
      .from("Quizzes")
      .delete()
      .eq("id", id);

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
