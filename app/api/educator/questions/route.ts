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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const questionType = searchParams.get("question_type");
    const search = searchParams.get("search");

    let query = supabase
      .from("Questions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subject) query = query.eq("subject", subject);
    if (topic) query = query.eq("topic", topic);
    if (questionType) query = query.eq("question_type", questionType);
    if (search) {
      // Search in question_details->>'question' for MCQ/free_response types
      query = query.or(
        `topic.ilike.%${search}%,subject.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get distinct subjects and topics for filter dropdowns
    const { data: meta } = await supabase
      .from("Questions")
      .select("subject, topic, question_type");

    const subjects = [...new Set((meta || []).map((q) => q.subject).filter(Boolean))].sort();
    const topics = [...new Set((meta || []).map((q) => q.topic).filter(Boolean))].sort();
    const questionTypes = [...new Set((meta || []).map((q) => q.question_type).filter(Boolean))].sort();

    return NextResponse.json({ questions: data || [], subjects, topics, questionTypes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const { subject, topic, question_type, question_details } = body;

    if (!subject || !topic || !question_type || !question_details) {
      return NextResponse.json(
        { error: "subject, topic, question_type, and question_details are required" },
        { status: 400 }
      );
    }

    const validTypes = ["mcq", "free_response", "drag_drop", "ged_extended_response"];
    if (!validTypes.includes(question_type)) {
      return NextResponse.json(
        { error: `question_type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("Questions")
      .insert({ subject, topic, question_type, question_details })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ question: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
