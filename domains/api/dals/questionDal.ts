import {createClient} from "@/lib/supabase/server";

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

async function getRandomQuestionsByTopic(topic: QuestionTopic, amount: number) {
  const supabase = await createClient();

  const {data, error} = await supabase.rpc("get_random_questions_by_topic", {
    p_topic: topic,
    p_amount: amount,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getQuestionsByIds(questionIds: string[]) {
  const supabase = await createClient();

  const {data, error} = await supabase.from("Questions").select("*").in("id", questionIds);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export default {
  getRandomQuestionsByTopic,
  getQuestionsByIds,
};
