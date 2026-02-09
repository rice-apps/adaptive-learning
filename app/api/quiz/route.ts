import quizManager from "@/domains/api/managers/quizManager";
import {NextRequest, NextResponse} from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const includeTemplates = searchParams.get("includeTemplates") === "true";

    if (!educatorId && !studentId) {
      return NextResponse.json({error: "At least one of educatorId or studentId is required"}, {status: 400});
    }

    const filters: {educatorId?: string; studentId?: string} = {};
    if (educatorId) filters.educatorId = educatorId;
    if (studentId) filters.studentId = studentId;

    const quizzes = await quizManager.getQuizzes(filters);

    // Include shared GED Extended Response "template" quizzes so any instructor
    // can assign them from the Existing tab, even if a different educator_id originally created them.
    if (includeTemplates && educatorId) {
      const supabase = await createClient();

      const { data: gedQuestions, error: qErr } = await supabase
        .from("Questions")
        .select("id")
        .eq("question_type", "ged_extended_response");

      if (!qErr && (gedQuestions || []).length > 0) {
        const gedIds = (gedQuestions || []).map((q: any) => q.id);

        const { data: templateQuizzes, error: tErr } = await supabase
          .from("Quizzes")
          .select("*")
          .contains("questions", gedIds);

        if (!tErr && Array.isArray(templateQuizzes)) {
          const byId = new Map<string, any>();
          for (const q of quizzes || []) byId.set((q as any).id, q);
          for (const q of templateQuizzes) byId.set((q as any).id, q);
          return NextResponse.json(Array.from(byId.values()));
        }
      }
    }

    return NextResponse.json(quizzes);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}
