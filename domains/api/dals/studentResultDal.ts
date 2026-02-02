import {createClient} from "@/lib/supabase/server";

export interface StudentResult {
  id: number;
  created_at: string;
  student_id: string | null;
  quiz_id: string | null;
  question_id: string | null;
  student_answer: string | null;
  feedback: string | null;
}

async function getResultsByStudentId(studentId: string): Promise<StudentResult[]> {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Results")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data as StudentResult[]) || [];
}

export default {
  getResultsByStudentId,
};