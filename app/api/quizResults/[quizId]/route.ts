import {NextResponse} from "next/server";
import quizResultManager from "@/domains/api/managers/quizResultManager";

export async function GET(request: Request, {params}: {params: Promise<{quizId: string}>}) {
  try {
    const {quizId} = await params;

    if (!quizId) {
      return NextResponse.json({error: "Quiz ID is required"}, {status: 400});
    }

    const results = await quizResultManager.getQuizResults(quizId);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}
