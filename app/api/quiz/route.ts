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
