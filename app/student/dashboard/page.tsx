import StudentDashboardClient from "@/domains/student/dashboard/StudentDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Get Student Data
  const { data: student } = await supabase
    .from("Students")
    .select("first_name, diagnostic_results, progress")
    .eq("id", user.id)
    .single();

  // 2. Check if Diagnostic is done
  // logic: if diagnostic_results is not null, they are done.
  const hasCompletedDiagnostic = !!student?.diagnostic_results;

  // 3. Get Completed Quizzes (for Recent Activity)
  const { data: completedQuizzes } = await supabase
    .from("Quizzes")
    .select("*")
    .eq("student_id", user.id)
    .eq("submitted", true)
    .order("end_time", { ascending: false })
    .limit(5);

  // 4. Get Assigned Quizzes (Pending)
  const { data: assignedQuizzesRaw } = await supabase
    .from("Quizzes")
    .select("*")
    .eq("student_id", user.id)
    .is("submitted", null) // Only fetch unsubmitted ones
    .order("created_at", { ascending: false });

  // 5. Fetch due dates from Deadlines table
  const quizIds = (assignedQuizzesRaw || []).map((q) => q.id);
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

  // 6. Enrich Assigned Quizzes with Subject and due_date
  const assignedQuizzes = await Promise.all(
    (assignedQuizzesRaw || []).map(async (quiz) => {
      let subject = "General";
      if (quiz.questions && quiz.questions.length > 0) {
        const { data: qData } = await supabase
          .from("Questions")
          .select("subject")
          .eq("id", quiz.questions[0])
          .single();
        if (qData) subject = qData.subject;
      }
      return { ...quiz, subject, due_date: dueByQuizId[quiz.id] ?? null };
    })
  );

  return (
    <StudentDashboardClient
      studentName={student?.first_name || "Student"}
      courseProgress={student?.progress ?? 0}
      hasCompletedDiagnostic={hasCompletedDiagnostic}
      completedQuizzes={completedQuizzes || []}
      assignedQuizzes={assignedQuizzes || []}
    />
  );
}