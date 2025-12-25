import StudentDashboardClient from "./StudentDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("Students")
    .select("profileName")
    .eq("id", user.id)
    .single();

  const { data: completedQuizzes } = await supabase
    .from("Quizzes")
    .select("id, start_time, end_time, time_spent, submitted")
    .eq("student_id", user.id)
    .not("submitted", "is", null)
    .order("submitted", { ascending: false })
    .limit(3);

  const hasCompletedDiagnostic = !!completedQuizzes?.length;

  return (
    <StudentDashboardClient
      student={student?.profileName}
      completedQuizzes={completedQuizzes ?? []}
      hasCompletedDiagnostic={hasCompletedDiagnostic}
    />
  );
}
