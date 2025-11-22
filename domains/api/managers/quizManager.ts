import quizDAL from "../dals/quizDal";
import {getRandomQuestionsByTopic} from "./questionManager";
import {QuestionTopic} from "../dals/questionDal";

type TopicQuestionDistribution = Record<QuestionTopic, number>;

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
    const questions = await getRandomQuestionsByTopic(topic as QuestionTopic, amount);

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

export default {
  generateQuiz,
};
