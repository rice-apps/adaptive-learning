import {NextResponse} from "next/server";
import studentResultManager from "@/domains/api/managers/studentResultManager";

export async function GET(request: Request, {params}: {params: Promise<{studentId: string}>}) {
  try {
    const {studentId} = await params;

    if (!studentId) {
      return NextResponse.json({error: "Student ID is required"}, {status: 400});
    }

    const quizzes = await studentResultManager.getQuizzesByStudent(studentId);

    return NextResponse.json(quizzes);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}