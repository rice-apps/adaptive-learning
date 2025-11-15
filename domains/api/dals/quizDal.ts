import {createClient} from "@/lib/supabase/server";

async function insertQuiz(questions: string[], educatorId: string, studentId: string) {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Quizzes")
    .insert([{questions: questions, educator_id: educatorId, student_id: studentId}])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  insertQuiz,
};
