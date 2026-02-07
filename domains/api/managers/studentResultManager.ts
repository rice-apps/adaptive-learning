import studentResultDAL from "../dals/studentResultDal";
import {StudentQuiz} from "../dals/studentResultDal";

async function getQuizzesByStudent(studentId: string): Promise<StudentQuiz[]> {
  return await studentResultDAL.getQuizzesByStudentId(studentId);
}

export default {
  getQuizzesByStudent,
};