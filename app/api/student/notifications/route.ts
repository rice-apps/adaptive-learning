import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/** GET: list quiz_assigned notifications for the current student */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: rows, error } = await admin
    .from("Notifications")
    .select("id, quiz_id, educator_id, created_at, is_read")
    .eq("student_id", user.id)
    .eq("type", "quiz_assigned")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notifications", details: error.message }, { status: 500 });
  }

  // Enrich with quiz names
  const quizIds = [...new Set((rows || []).map((r) => r.quiz_id).filter(Boolean))];
  let quizMap: Record<string, string> = {};
  if (quizIds.length > 0) {
    const { data: quizzes } = await admin
      .from("Quizzes")
      .select("id, name")
      .in("id", quizIds);
    quizMap = Object.fromEntries((quizzes || []).map((q) => [q.id, q.name ?? "Quiz"]));
  }

  const notifications = (rows || []).map((r) => ({
    id: r.id,
    quizId: r.quiz_id,
    quizName: quizMap[r.quiz_id] ?? "Quiz",
    createdAt: r.created_at,
    read: !!r.is_read,
    unread: !r.is_read,
  }));

  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((n) => n.unread).length,
  });
}

/** PATCH: mark notification(s) as read. Body: { ids?: string[], markAll?: boolean } */
export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids, markAll } = body;

  let query = admin
    .from("Notifications")
    .update({ is_read: true })
    .eq("student_id", user.id)
    .eq("type", "quiz_assigned");

  if (markAll) {
    query = query.eq("is_read", false);
  } else if (Array.isArray(ids) && ids.length > 0) {
    query = query.in("id", ids);
  } else {
    return NextResponse.json({ error: "Provide ids[] or markAll: true" }, { status: 400 });
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}