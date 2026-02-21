import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Returns service-role client for Notifications/Students (bypasses RLS). */
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/** Resolve educator id from auth user. */
async function getEducatorId(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string
) {
  let { data } = await supabase
    .from("Educators")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (!data) {
    const byId = await supabase
      .from("Educators")
      .select("id")
      .eq("id", userId)
      .single();
    data = byId.data;
  }
  return data?.id ?? null;
}

/** GET: list at-risk notifications for the current educator */
export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const educatorId = await getEducatorId(supabase, user.id);
  if (!educatorId) {
    return NextResponse.json({ error: "Educator not found" }, { status: 404 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const NOTIFICATIONS_PAGE_SIZE = 50;

  const { data: rows, error } = await admin
    .from("Notifications")
    .select(
      `
      id,
      student_id,
      created_at,
      is_read
    `
    )
    .eq("educator_id", educatorId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_PAGE_SIZE);

  if (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch notifications",
        details: error.message,
      },
      { status: 500 }
    );
  }

  const studentIds = [...new Set((rows || []).map((r) => r.student_id))];
  let students: { id: string; first_name?: string; last_name?: string }[] = [];
  if (studentIds.length > 0) {
    const { data: studentRows } = await admin
      .from("Students")
      .select("id, first_name, last_name")
      .in("id", studentIds);
    students = studentRows || [];
  }
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const notifications = (rows || []).map((r) => {
    const student = studentMap[r.student_id];
    const name =
      [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
      "Student";
    return {
      id: r.id,
      studentId: r.student_id,
      studentName: name,
      createdAt: r.created_at,
      read: !!r.is_read,
      unread: !r.is_read,
    };
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return NextResponse.json({
    notifications,
    unreadCount,
  });
}

/** PATCH: mark notification(s) as read. Body: { ids?: string[], markAll?: boolean } */
export async function PATCH(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const educatorId = await getEducatorId(supabase, user.id);
  if (!educatorId) {
    return NextResponse.json({ error: "Educator not found" }, { status: 404 });
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { ids, markAll } = body;

  let query = admin
    .from("Notifications")
    .update({ is_read: true })
    .eq("educator_id", educatorId);

  if (markAll) {
    query = query.eq("is_read", false);
  } else if (Array.isArray(ids) && ids.length > 0) {
    query = query.in("id", ids);
  } else {
    return NextResponse.json(
      { error: "Provide ids[] or markAll: true" },
      { status: 400 }
    );
  }

  const { error } = await query;
  if (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
