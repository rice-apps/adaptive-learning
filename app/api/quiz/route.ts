import quizManager from "@/domains/api/managers/quizManager";
import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {topic_question_distribution, educatorId, studentId} = await request.json();

    if (!topic_question_distribution) {
      return NextResponse.json({error: "Topic question distribution is required"}, {status: 400});
    }

    if (!educatorId) {
      return NextResponse.json({error: "Educator ID is required"}, {status: 400});
    }

    if (!studentId) {
      return NextResponse.json({error: "Student ID is required"}, {status: 400});
    }

    const quiz = await quizManager.generateQuiz(topic_question_distribution, educatorId, studentId);

    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}

export async function GET(req: NextRequest) {
  try {
    const {searchParams} = req.nextUrl;
    const educatorId = searchParams.get("educatorId");
    const studentId = searchParams.get("studentId");

    if (!educatorId && !studentId) {
      return NextResponse.json({error: "At least one of educatorId or studentId is required"}, {status: 400});
    }

    const filters: {educatorId?: string; studentId?: string} = {};
    if (educatorId) filters.educatorId = educatorId;
    if (studentId) filters.studentId = studentId;

    const quizzes = await quizManager.getQuizzes(filters);

    return NextResponse.json(quizzes);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}
