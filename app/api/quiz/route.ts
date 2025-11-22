import quizManager from "@/domains/api/managers/quizManager";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { topic_question_distribution, educatorId, studentId } = await request.json();
  const quiz = await quizManager.generateQuiz(topic_question_distribution, educatorId, studentId);
  return NextResponse.json(quiz);
}