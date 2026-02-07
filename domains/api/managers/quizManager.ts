import {z} from "zod";
import {mastra} from "@/mastra";
import quizDAL from "../dals/quizDal";
import quizResultManager from "./quizResultManager";
import questionManager from "./questionManager";
import {QuestionTopic} from "../dals/questionDal";

type TopicQuestionDistribution = Record<QuestionTopic, number>;

const topicDistributionSchema = z.object({
  topicDistribution: z.array(z.object({topic: z.string(), count: z.number()})),
  reasoning: z.string(),
});

async function generateQuiz(
  topic_question_distribution: TopicQuestionDistribution,
  educatorId: string,
  studentId: string,
  provided_question_ids?: string[],
) {
  const allQuestionIds: string[] = [];

  // Get random questions for each topic
  for (const [topic, amount] of Object.entries(topic_question_distribution)) {
    if (amount === undefined) continue;
    const questions = await questionManager.getRandomQuestionsByTopic(topic as QuestionTopic, amount);

    // Extract question IDs (assuming questions have an 'id' field)
    const questionIds = questions.map((question: any) => question.id);
    allQuestionIds.push(...questionIds);
  }

  // Add provided question IDs if any
  if (provided_question_ids && provided_question_ids.length > 0) {
    allQuestionIds.push(...provided_question_ids);
  }

  // Insert quiz into database
  const quiz = await quizDAL.insertQuiz(allQuestionIds, educatorId, studentId);

  return quiz;
}

async function getFullQuiz(quizId: string) {
  return await quizDAL.getFullQuiz(quizId);
}

async function getQuizzes(filters: {educatorId?: string; studentId?: string}) {
  return await quizDAL.getQuizzes(filters);
}

async function generateTopicDistributionFromQuizFeedback(quizId: string) {
  const quizResults = await quizResultManager.getQuizResults(quizId);
  const feedback = quizResults
    .map(r => {
      const q = r.question_info!;
      const fb = r.feedback?.trim() ?? "";
      return `Topic: ${q.topic}
Subject: ${q.subject}
Question type: ${q.question_type}
Question details: ${JSON.stringify(q.question_details)}

Feedback: ${fb}`;
    })
    .join("\n\n---\n\n");

  const agent = mastra.getAgent("createQuizFromFeedbackAgent");
  if (!agent) throw new Error("Create Quiz from Feedback agent not found");

  const prompt = `Create a topic distribution for a new quiz to help this student practice and improve.

QUIZ FEEDBACK:
${feedback}
`;

  const result = await agent.generate([{role: "user", content: prompt}], {
    structuredOutput: {schema: topicDistributionSchema},
  });

  const resultObject = result.object as z.infer<typeof topicDistributionSchema>;
  const topicDistribution = Object.fromEntries(
    resultObject.topicDistribution.map(({topic, count}) => [topic, count]),
  ) as TopicQuestionDistribution;
  return {topicDistribution, reasoning: resultObject.reasoning};
}

export default {
  generateQuiz,
  getFullQuiz,
  getQuizzes,
  generateTopicDistributionFromQuizFeedback,
};
