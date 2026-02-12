import {createClient} from "@/lib/supabase/server";

/** Question row as stored in public."Questions" */
export interface QuestionRow {
  id: string;
  created_at: string | null;
  subject: string | null;
  topic: string | null;
  question_type: string | null;
  question_details: Record<string, unknown> | null;
  image_url: string | null;
  image_path: string | null;
}

export interface QuizResult {
  id: number;
  created_at: string;
  student_id: string | null;
  quiz_id: string | null;
  question_id: string | null;
  student_answer: string | null;
  feedback: string | null;
  question_info: QuestionRow;
}

async function getResultsByQuizId(quizId: string): Promise<QuizResult[]> {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Results")
    .select("*, question_info:Questions(*)")
    .eq("quiz_id", quizId)
    .order("created_at", {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data as QuizResult[]) || [];
}

export default {
  getResultsByQuizId,
};
