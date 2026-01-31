import {createClient} from "@/lib/supabase/server";

export interface Question {
  id: string;
  created_at: string | null;
  subject: string | null;
  topic: string | null;
  question_type: string | null;
  question_details: Record<string, any> | null;
  image_url?: string | null;
}

export type QuestionTopic =
  // Mathematical Reasoning
  | "Number operations & number sense"
  | "Fractions, decimals, ratios, and proportions"
  | "Percents and rates"
  | "Measurement & geometry (area, volume, perimeter)"
  | "Expressions, equations, and inequalities"
  | "Linear functions & graphing"
  | "Polynomials & factoring"
  | "Word problems and real-world applications"
  // Reasoning Through Language Arts (RLA)
  | "Comprehension of informational and literary texts"
  | "Inference and evidence-based reasoning"
  | "Evaluating claims, bias, and author's purpose"
  | "Writing evidence-based responses (extended response/essay)"
  | "Sentence structure & punctuation"
  | "Grammar usage, capitalization, and word choice"
  // Science
  | "Cells, genetics, evolution, and ecosystems"
  | "Matter, motion, energy, and force"
  | "Climate, Earth systems, and the solar system"
  | "Experimental design, data interpretation, and analysis"
  // Social Studies
  | "The U.S. Constitution, branches of government, rights, and responsibilities"
  | "Colonization, Civil War, Reconstruction, Civil Rights Movement, modern America"
  | "Supply and demand, markets, and government influence"
  | "Global interdependence, historical movements, and geography skills";

// Optional shape for question_details when it includes an image.
// image_url points to e.g. Supabase Storage (quiz-images).
export type QuestionDetailsWithImage = Record<string, any> & { image_url?: string };

async function getRandomQuestionsByTopic(topic: QuestionTopic, amount: number): Promise<Question[]> {
  const supabase = await createClient();

  const {data, error} = await supabase.rpc("get_random_questions_by_topic", {
    p_topic: topic,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data as Question[]) || [];
}

async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  const supabase = await createClient();

  const {data, error} = await supabase.from("Questions").select("*").in("id", questionIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Question[]) || [];
}

export default {
  getRandomQuestionsByTopic,
  getQuestionsByIds,
};
