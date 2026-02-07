import quizManager from "@/domains/api/managers/quizManager";
import type {QuestionTopic} from "@/domains/api/dals/questionDal";
import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {quizId} = body;

    if (!quizId) {
      return NextResponse.json({error: "quizId is required"}, {status: 400});
    }

    const sourceQuiz = await quizManager.getFullQuiz(quizId);
    const educatorId = sourceQuiz.educator_id;
    const studentId = sourceQuiz.student_id;

    const {topicDistribution, reasoning} = await quizManager.generateTopicDistributionFromQuizFeedback(quizId);

    const quizzes = await quizManager.generateQuiz(
      topicDistribution as Record<QuestionTopic, number>,
      educatorId,
      studentId,
    );
    const quiz = quizzes[0];
    if (!quiz) {
      throw new Error("Failed to create quiz");
    }

    return NextResponse.json({
      quiz,
      topicDistribution,
      reasoning,
    });
  } catch (error) {
    console.error("Generate from feedback error:", error);
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}
