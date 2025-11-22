import {NextResponse} from "next/server";
import quizManager from "@/domains/api/managers/quizManager";

export async function GET(request: Request, {params}: {params: Promise<{quizid: string}>}) {
  try {
    const {quizid} = await params;

    if (!quizid) {
      return NextResponse.json({error: "Quiz ID is required"}, {status: 400});
    }

    const quiz = await quizManager.getFullQuiz(quizid);

    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}
