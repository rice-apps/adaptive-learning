import studentResultDAL from "../dals/studentResultDal";
import {StudentResult} from "../dals/studentResultDal";

async function getResultsByStudent(studentId: string): Promise<StudentResult[]> {
  return await studentResultDAL.getResultsByStudentId(studentId);
}

export default {
  getResultsByStudent,
};