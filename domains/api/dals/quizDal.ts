import {createClient} from "@/lib/supabase/server";
import questionManager from "../managers/questionManager";
import {Question} from "./questionDal";

export interface Quiz {
  id: string;
  questions: string[] | null;
  educator_id: string;
  student_id: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  time_spent: string | null;
  submitted: string | null;
}

export interface FullQuiz extends Quiz {
  full_questions: Question[];
}

async function insertQuiz(questions: string[], educatorId: string, studentId: string): Promise<Quiz[]> {
  const supabase = await createClient();

  const {data, error} = await supabase
    .from("Quizzes")
    .insert([{questions: questions, educator_id: educatorId, student_id: studentId}])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Quiz[]) || [];
}

async function getFullQuiz(quizId: string): Promise<FullQuiz> {
  const supabase = await createClient();

  // Get the quiz
  const {data: quiz, error: quizError} = await supabase.from("Quizzes").select("*").eq("id", quizId).single();

  if (quizError || !quiz) {
    throw new Error(quizError?.message || "Quiz not found");
  }

  const quizData = quiz as Quiz;

  // Get all questions for this quiz
  if (quizData.questions && quizData.questions.length > 0) {
    const questions = await questionManager.getQuestionsByIds(quizData.questions);

    return {
      ...quizData,
      full_questions: questions,
    };
  }

  return {
    ...quizData,
    full_questions: [],
  };
}

async function getQuizzes(filters: {educatorId?: string; studentId?: string}): Promise<Quiz[]> {
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

  return (data as Quiz[]) || [];
}

export default {
  insertQuiz,
  getFullQuiz,
  getQuizzes,
};
