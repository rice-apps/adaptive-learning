import {createClient} from "@/lib/supabase/server";

export interface Result {
  id: number;
  created_at: string;
  student_id: string | null;
  quiz_id: string | null;
  question_id: string | null;
  student_answer: string | null;
  feedback: string | null;
}

async function getResultsByQuizId(quizId: string): Promise<Result[]> {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Results")
    .select("*")
    .eq("quiz_id", quizId)
    .order("created_at", {ascending: true});

  if (error) {
    throw new Error(error.message);
  }

  return (data as Result[]) || [];
}

export default {
  getResultsByQuizId,
};
