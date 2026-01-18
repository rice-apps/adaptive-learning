import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This creates a quiz assignment by inserting into Quizzes table
export async function POST(request: NextRequest) {
  try {
    const { quizId, studentId, educatorId, dueDate } = await request.json();

    if (!quizId || !studentId || !educatorId) {
      return NextResponse.json(
        { error: "quizId, studentId, and educatorId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the quiz to duplicate its questions
    const { data: originalQuiz, error: quizError } = await supabase
      .from('Quizzes')
      .select('questions')
      .eq('id', quizId)
      .single();

    if (quizError || !originalQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Create a new quiz for this student
    const { data: newQuiz, error: insertError } = await supabase
      .from('Quizzes')
      .insert({
        questions: originalQuiz.questions,
        educator_id: educatorId,
        student_id: studentId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // If there's a due date, add it to Deadlines table
    if (dueDate && newQuiz) {
      const { data: userData } = await supabase
        .from('Students')
        .select('user_id')
        .eq('id', studentId)
        .single();

      const { data: educatorUserData } = await supabase
        .from('Educators')
        .select('user_id')
        .eq('id', educatorId)
        .single();

      if (userData && educatorUserData) {
        await supabase.from('Deadlines').insert({
          student: userData.user_id,
          educator: educatorUserData.user_id,
          quiz: newQuiz.id,
          deadline: dueDate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      quiz: newQuiz,
      message: "Quiz assigned successfully"
    });
  } catch (error) {
    console.error('Error in POST /api/quiz/assign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Get assigned quizzes for a student or educator's quizzes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const studentId = searchParams.get("studentId");
    const educatorId = searchParams.get("educatorId");

    if (!studentId && !educatorId) {
      return NextResponse.json(
        { error: "Either studentId or educatorId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from('Quizzes')
      .select(`
        id,
        questions,
        created_at,
        submitted,
        score,
        educator_id,
        student_id
      `);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (educatorId) {
      query = query.eq('educator_id', educatorId);
    }

    // Only get quizzes that haven't been started yet (assigned but not taken)
    query = query.is('submitted', null);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return empty array if no quizzes found
    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // Get deadlines for these quizzes
    const quizIds = data.map(q => q.id);
    let deadlinesData: any[] = [];

    if (quizIds.length > 0) {
      const { data: deadlines } = await supabase
        .from('Deadlines')
        .select('*')
        .in('quiz', quizIds);

      deadlinesData = deadlines || [];
    }

    // Merge deadlines with quizzes
    const quizzesWithDeadlines = data.map(quiz => {
      const deadline = deadlinesData.find(d => d.quiz === quiz.id);
      return {
        ...quiz,
        due_date: deadline?.deadline || null,
      };
    });

    return NextResponse.json(quizzesWithDeadlines);
  } catch (error) {
    console.error('Error in GET /api/quiz/assign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}