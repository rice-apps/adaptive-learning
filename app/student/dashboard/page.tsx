import StudentDashboardClient from "@/domains/student/dashboard/StudentDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get student data and check diagnostic_results column for completion
  const { data: student } = await supabase
    .from("Students")
    .select("first_name, diagnostic_results")
    .eq("id", user.id)
    .single();

  // Check if diagnostic quiz is completed by looking at diagnostic_results column
  // If diagnostic_results exists and has completed_at, diagnostic is done
  const hasCompletedDiagnostic = !!(
    student?.diagnostic_results && 
    student.diagnostic_results.completed_at
  );

  // Get recent completed quizzes for display
  const { data: completedQuizzes } = await supabase
    .from("Quizzes")
    .select("id, start_time, end_time, time_spent, submitted")
    .eq("student_id", user.id)
    .not("submitted", "is", null)
    .order("submitted", { ascending: false })
    .limit(3);

  return (
    <StudentDashboardClient
      student={student?.first_name}
      completedQuizzes={completedQuizzes ?? []}
      hasCompletedDiagnostic={hasCompletedDiagnostic}
    />
  );
}
