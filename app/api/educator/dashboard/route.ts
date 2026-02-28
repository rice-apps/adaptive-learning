import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Add these type definitions
interface Quiz {
  id: string;
  score: number;
  questions: string[] | null;
  student_id: string;
}

interface Question {
  id: string;
  topic: string;
  subject: string;
}

interface Student {
  id: string;
  email: string;
  progress: number;
  isActive: boolean;
  first_name: string;
  avatar: string;
}

interface RecentQuiz {
  id: string;
  score: number;
  created_at: string;
  student_id: string;
  Students: {
    first_name: string;
  } | null;
}

export async function GET() {
  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("ENV CHECK:", {
    hasURL: !!supabaseURL,
    hasKey: !!supabaseKEY,
  });

  if (!supabaseURL || !supabaseKEY) {
    return NextResponse.json(
      { error: "Supabase environment variables not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseURL, supabaseKEY);

  try {
    // Fetch students - type the response
    const { data: students, error: studentsError } = await supabase
      .from("Students")
      .select(
        `
        id,
        email,
        progress,
        isActive,
        first_name,
        avatar
      `
      )
      .order("created_at", { ascending: false });

    if (studentsError) {
      console.error("Supabase error (students):", studentsError);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    // Fetch quizzes with low scores - type the response
    const { data: lowScoreQuizzes, error: quizzesError } = await supabase
      .from("Quizzes")
      .select(
        `
        id,
        score,
        questions,
        student_id
      `
      )
      .lt("score", 70)
      .not("questions", "is", null);

    // Type assertion for lowScoreQuizzes
    const typedQuizzes = lowScoreQuizzes as Quiz[] | null;

    // Calculate weaknesses (OPTIMIZED VERSION)
    let weaknesses: Array<{
      id: number;
      topic: string;
      subject: string;
      studentCount: number;
    }> = [];
    
    if (!quizzesError && typedQuizzes && typedQuizzes.length > 0) {
      // Get all unique question IDs from all low-scoring quizzes
      const allQuestionIds = typedQuizzes
        .flatMap(quiz => quiz.questions || [])
        .filter((id, index, self) => self.indexOf(id) === index);

      if (allQuestionIds.length > 0) {
        // Fetch all questions at once
        const { data: allQuestions, error: questionsError } = await supabase
          .from("Questions")
          .select("id, topic, subject")
          .in("id", allQuestionIds);

        const typedQuestions = allQuestions as Question[] | null;

        if (!questionsError && typedQuestions) {
          // Create a question lookup map
          const questionMap = new Map<string, Question>(
            typedQuestions.map(q => [q.id, q])
          );

          // Calculate weaknesses using the map
          const weaknessMap = new Map<string, {
            topic: string;
            subject: string;
            studentIds: Set<string>;
          }>();
          
          for (const quiz of typedQuizzes) {
            if (!quiz.questions || quiz.questions.length === 0) continue;

            quiz.questions.forEach(questionId => {
              const question = questionMap.get(questionId);
              if (!question) return;
              
              const key = `${question.subject}-${question.topic}`;
              if (!weaknessMap.has(key)) {
                weaknessMap.set(key, {
                  topic: question.topic,
                  subject: question.subject,
                  studentIds: new Set(),
                });
              }
              weaknessMap.get(key)!.studentIds.add(quiz.student_id);
            });
          }

          // Convert to array and format
          weaknesses = Array.from(weaknessMap.values())
            .map((w, index) => ({
              id: index + 1,
              topic: w.topic,
              subject: w.subject,
              studentCount: w.studentIds.size,
            }))
            .sort((a, b) => b.studentCount - a.studentCount)
            .slice(0, 10);
        } else if (questionsError) {
          console.error("Error fetching questions:", questionsError);
        }
      }
    } else if (quizzesError) {
      console.error("Error fetching quizzes:", quizzesError);
    }

    // Fetch recent quizzes for "Recent Assessment Results"
    const { data: recentQuizzes, error: recentError } = await supabase
      .from("Quizzes")
      .select(
        `
        id,
        score,
        created_at,
        student_id
      `
      )
      .not("score", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    const typedRecentQuizzes = recentQuizzes as RecentQuiz[] | null;

    if (recentError) {
      console.error("Error fetching recent quizzes:", recentError);
    }

    // Format recent assessments
    const formattedRecent = typedRecentQuizzes?.map((quiz) => ({
      studentName: quiz.Students?.first_name || "Unknown Student",
      quizName: "Quiz",
      score: quiz.score,
      timeAgo: formatTimeAgo(quiz.created_at),
    })) || [];

    // Type assertion for students
    const typedStudents = students as Student[] | null;

    // Format students
    const formattedStudents = (typedStudents || []).map((s) => ({
      id: s.id,
      email: s.email,
      progress: s.progress,
      status: s.isActive ? "On Track" : "At Risk",
      first_name: s.first_name,
      avatar: s.avatar,
    }));

    return NextResponse.json({
      students: formattedStudents,
      total: formattedStudents.length,
      weaknesses: weaknesses,
      recentAssessments: formattedRecent,
    });
    
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}