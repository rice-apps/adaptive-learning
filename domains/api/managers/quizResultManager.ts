import quizResultDAL from "../dals/quizResultDal";
import {QuizResult} from "../dals/quizResultDal";

async function getQuizResults(quizId: string): Promise<QuizResult[]> {
  return await quizResultDAL.getResultsByQuizId(quizId);
}

export default {
  getQuizResults,
};
