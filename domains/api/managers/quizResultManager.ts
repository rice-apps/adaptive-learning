import quizResultDAL from "../dals/quizResultDal";
import {Result} from "../dals/quizResultDal";

async function getQuizResults(quizId: string): Promise<Result[]> {
  return await quizResultDAL.getResultsByQuizId(quizId);
}

export default {
  getQuizResults,
};
