import questionDAL, {QuestionTopic} from "../dals/questionDal";

async function getRandomQuestionsByTopic(topic: QuestionTopic, amount: number) {
  return await questionDAL.getRandomQuestionsByTopic(topic, amount);
}

async function getQuestionsByIds(questionIds: string[]) {
  return await questionDAL.getQuestionsByIds(questionIds);
}

export default {
  getRandomQuestionsByTopic,
  getQuestionsByIds,
};
