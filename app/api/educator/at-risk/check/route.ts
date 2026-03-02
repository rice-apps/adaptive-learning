import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isActiveFromLastActive } from "@/lib/student-status";

/**
 * Runs at-risk check - finds students who have completed the diagnostic and
 * are inactive & creates in-app notifications for their educators.
 */
export async function POST(request: Request) {
  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseURL || !supabaseKEY) {
    return NextResponse.json(
      { error: "Supabase environment variables not configured" },
      { status: 500 }
    );
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace(/^Bearer\s+/i, "") ||
      request.headers.get("x-cron-secret");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(supabaseURL, supabaseKEY);

  try {
    const { data: students, error: studentsError } = await supabase
      .from("Students")
      .select(
        "id, lastActive, diagnostic_results, at_risk_notified_at, first_name, last_name"
      )
      .not("diagnostic_results", "is", null);

    if (studentsError) {
      console.error("At-risk check: fetch students error", studentsError);
      return NextResponse.json(
        {
          error: "Failed to fetch students",
          details: studentsError.message,
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    let notifiedCount = 0;

    for (const s of students || []) {
      const hasCompletedDiagnostic = !!s.diagnostic_results;
      const activeByTime = isActiveFromLastActive(s.lastActive ?? null);
      const isAtRisk = hasCompletedDiagnostic && !activeByTime;

      if (!isAtRisk) continue;

      const alreadyNotified = s.at_risk_notified_at != null;
      const becameActiveAfterNotification =
        alreadyNotified &&
        s.lastActive != null &&
        new Date(s.lastActive) > new Date(s.at_risk_notified_at);
      const shouldNotify = !alreadyNotified || becameActiveAfterNotification;

      if (!shouldNotify) continue;

      let educatorIds: string[] = [];
      const { data: quizRows } = await supabase
        .from("Quizzes")
        .select("educator_id")
        .eq("student_id", s.id);
      if (quizRows?.length) {
        educatorIds = [
          ...new Set(quizRows.map((r: { educator_id: string }) => r.educator_id)),
        ];
      }
      if (educatorIds.length === 0) {
        const { data: educators } = await supabase
          .from("Educators")
          .select("id");
        educatorIds = (educators || []).map((e: { id: string }) => e.id);
      }

      const studentName =
        [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id;

      for (const educatorId of educatorIds) {
        const { error: insertError } = await supabase
          .from("Notifications")
          .insert({
            educator_id: educatorId,
            student_id: s.id,
            created_at: now,
          });
        if (insertError) {
          console.error("[At-risk check] insert notification failed", insertError);
          continue;
        }
        notifiedCount += 1;
      }

      await supabase
        .from("Students")
        .update({ at_risk_notified_at: now })
        .eq("id", s.id);
    }

    return NextResponse.json({
      ok: true,
      checked: students?.length ?? 0,
      notificationsCreated: notifiedCount,
    });
  } catch (err) {
    console.error("At-risk check error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
