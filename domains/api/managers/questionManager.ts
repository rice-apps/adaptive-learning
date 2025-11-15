import questionDAL, {QuestionTopic} from "../dals/questionDal";

export async function getRandomQuestionsByTopic(topic: QuestionTopic, amount: number) {
  return await questionDAL.getRandomQuestionsByTopic(topic, amount);
}
