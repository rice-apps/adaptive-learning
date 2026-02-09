import {createClient} from "@/lib/supabase/server";

export interface StudentQuiz {
  id: string;
  created_at: string;
  student_id: string | null;
  quiz_feedback: string | null;
  submitted: boolean | null;
  end_time: string | null;
}

async function getQuizzesByStudentId(studentId: string): Promise<StudentQuiz[]> {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Quizzes")
    .select("id, created_at, student_id, quiz_feedback, submitted, end_time")
    .eq("student_id", studentId)
    .order("created_at", {ascending: false});

  if (error) {
    throw new Error(error.message);
  }

  return (data as StudentQuiz[]) || [];
}

export default {
  getQuizzesByStudentId,
};