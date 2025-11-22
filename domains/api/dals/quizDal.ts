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

async function getFullQuiz(quizId: string) {
  const supabase = await createClient();

  // Get the quiz
  const {data: quiz, error: quizError} = await supabase.from("Quizzes").select("*").eq("id", quizId).single();

  if (quizError || !quiz) {
    throw new Error(quizError?.message || "Quiz not found");
  }

  // Get all questions for this quiz
  if (quiz.questions && quiz.questions.length > 0) {
    const {data: questions, error: questionsError} = await supabase
      .from("Questions")
      .select("*")
      .in("id", quiz.questions);

    if (questionsError) {
      throw new Error(questionsError.message);
    }

    return {
      ...quiz,
      questionDetails: questions || [],
    };
  }

  return {
    ...quiz,
    questionDetails: [],
  };
}

async function getQuizzes(filters: {educatorId?: string; studentId?: string}) {
  const supabase = await createClient();

  let query = supabase.from("Quizzes").select("*");

  if (filters.educatorId) {
    query = query.eq("educator_id", filters.educatorId);
  }

  if (filters.studentId) {
    query = query.eq("student_id", filters.studentId);
  }

  const {data, error} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  insertQuiz,
  getFullQuiz,
  getQuizzes,
};
