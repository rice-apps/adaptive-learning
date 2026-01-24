import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// hacky workaround for mvp, fix later
const EDUCATOR_ID = "98509cc4-36bf-4df0-b4b8-83ddd33eae74";

export async function POST(request: Request) {
  try {
    const {
      quizId,
      questions,
      answers,
      score,
      timeSpentSeconds,
      quizStartTime,
    } = await request.json();

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify quiz belongs to this user
    const { data: quiz, error: quizError } = await supabase
      .from("Quizzes")
      .select("id, student_id")
      .eq("id", quizId)
      .eq("student_id", user.id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: "Quiz not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create service client for database operations that need to bypass RLS
    if (!supabaseURL || !supabaseKEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createServiceClient(supabaseURL, supabaseKEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Analyze diagnostic results to determine strengths and weaknesses
    const analysis = analyzeDiagnosticResults(questions, answers);

    // Prepare raw results with question details and answers
    // Store these directly in diagnostic_results JSONB column (not in Results table)
    const rawResults = questions.map((question: any) => {
      const userAnswer = answers[question.id];
      const details = question.question_details || {};
      
      // Determine correct answer based on question type
      let correctAnswer: any;
      if (question.question_type === "drag_drop") {
        correctAnswer = details.qa_pairs?.map((q: any) => q.answer) || [];
      } else {
        correctAnswer = details.answer || "";
      }

      // Check if answer is correct
      let isCorrect = false;
      if (userAnswer !== null && userAnswer !== undefined) {
        if (question.question_type === "drag_drop") {
          if (
            Array.isArray(userAnswer) &&
            Array.isArray(correctAnswer) &&
            userAnswer.length === correctAnswer.length &&
            userAnswer.every((a, i) => a === correctAnswer[i])
          ) {
            isCorrect = true;
          }
        } else {
          if (String(userAnswer) === String(correctAnswer)) {
            isCorrect = true;
          }
        }
      }

      // Format answer for storage (keep original format)
      let formattedAnswer: any = userAnswer;
      if (formattedAnswer === null || formattedAnswer === undefined) {
        formattedAnswer = "";
      }

      return {
        question_id: question.id,
        question_type: question.question_type,
        subject: question.subject || null,
        topic: question.topic || null,
        question_text: details.question || null,
        student_answer: formattedAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
      };
    });

    // Prepare diagnostic results data to store in the diagnostic_results jsonb column
    // This includes both raw results AND analytics - all linked directly to the student
    const diagnosticResults = {
      completed_at: new Date().toISOString(),
      quiz_id: quizId,
      score: score,
      total_questions: questions.length,
      // Store raw results - all question answers linked directly to student
      results: rawResults,
      // Store analytics - strengths and weaknesses
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      // Store detailed performance breakdown by subject/topic
      performance_by_subject: calculatePerformanceBySubject(questions, answers),
    };

    // Update Students table with diagnostic results using service client
    const { error: updateError } = await supabaseAdmin
      .from("Students")
      .update({ diagnostic_results: diagnosticResults })
      .eq("id", user.id);

    if (updateError) {
      // Check if the column doesn't exist
      if (updateError.code === "PGRST204") {
        console.error(
          "diagnostic_results column does not exist. Please run the migration:",
          updateError
        );
        return NextResponse.json(
          {
            error:
              "Database column not found. Please add the diagnostic_results column to the Students table.",
            details: updateError.message,
          },
          { status: 500 }
        );
      }
      console.error("Error updating diagnostic_results:", updateError);
      return NextResponse.json(
        { error: "Failed to update diagnostic results: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Diagnostic quiz submitted successfully",
      diagnosticResults,
    });
  } catch (error) {
    console.error("Error submitting diagnostic quiz:", error);
    return NextResponse.json(
      {
        error: "Failed to submit diagnostic quiz",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Analyze diagnostic results to determine strengths and weaknesses
function analyzeDiagnosticResults(questions: any[], answers: Record<string, any>) {
  // Track performance by subject and topic
  const performanceBySubject: Record<
    string,
    {
      correct: number;
      total: number;
      topics: Record<string, { correct: number; total: number }>;
    }
  > = {};

  // Analyze each question
  for (const question of questions) {
    const userAnswer = answers[question.id];
    const details = question.question_details || {};
    const subject = question.subject || "Unknown";
    const topic = question.topic || "Unknown";

    // Initialize subject tracking if needed
    if (!performanceBySubject[subject]) {
      performanceBySubject[subject] = {
        correct: 0,
        total: 0,
        topics: {},
      };
    }

    // Initialize topic tracking if needed
    if (!performanceBySubject[subject].topics[topic]) {
      performanceBySubject[subject].topics[topic] = {
        correct: 0,
        total: 0,
      };
    }

    performanceBySubject[subject].total++;
    performanceBySubject[subject].topics[topic].total++;

    // Check if answer is correct
    let isCorrect = false;
    if (userAnswer) {
      if (question.question_type === "drag_drop") {
        const correctAnswers = details.qa_pairs?.map((q: any) => q.answer) || [];
        if (
          Array.isArray(userAnswer) &&
          userAnswer.length === correctAnswers.length &&
          userAnswer.every((a, i) => a === correctAnswers[i])
        ) {
          isCorrect = true;
        }
      } else {
        if (userAnswer === details.answer) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      performanceBySubject[subject].correct++;
      performanceBySubject[subject].topics[topic].correct++;
    }
  }

  // Calculate strengths and weaknesses
  const strengths: Array<{ skill: string; description: string; accuracy: number }> =
    [];
  const weaknesses: Array<{ skill: string; description: string; accuracy: number }> =
    [];

  // Analyze by subject first (more general analysis)
  for (const [subject, data] of Object.entries(performanceBySubject)) {
    // Skip "Unknown" subjects as they're not meaningful
    if (subject === "Unknown") continue;

    const accuracy = (data.correct / data.total) * 100;

    // Require at least 2 questions to make a meaningful assessment
    if (data.total >= 2) {
      if (accuracy >= 70) {
        // Strength: student performed well in this subject
        strengths.push({
          skill: subject,
          description: `Strong performance in ${subject} with ${Math.round(accuracy)}% accuracy`,
          accuracy,
        });
      } else if (accuracy < 50) {
        // Weakness: student struggled with this subject
        weaknesses.push({
          skill: subject,
          description: `Needs improvement in ${subject} with ${Math.round(accuracy)}% accuracy`,
          accuracy,
        });
      }
    }

    // Also analyze by topic within each subject (more specific analysis)
    for (const [topic, topicData] of Object.entries(data.topics)) {
      // Skip "Unknown" or "Diagnostic" topics as they're not meaningful for analysis
      if (topic === "Unknown" || topic === "Diagnostic") continue;

      if (topicData.total > 0) {
        const topicAccuracy = (topicData.correct / topicData.total) * 100;

        // For topics, we can be more lenient with single questions if accuracy is very high/low
        if (topicAccuracy >= 80 && topicData.total >= 1) {
          // Strong topic performance - check if we already have this as a strength
          const existingStrength = strengths.find((s) => s.skill === topic);
          if (!existingStrength) {
            strengths.push({
              skill: topic,
              description: `Excellent understanding of ${topic} (${Math.round(topicAccuracy)}% accuracy)`,
              accuracy: topicAccuracy,
            });
          }
        } else if (topicAccuracy < 50 && topicData.total >= 1) {
          // Weak topic performance - check if we already have this as a weakness
          const existingWeakness = weaknesses.find((w) => w.skill === topic);
          if (!existingWeakness) {
            weaknesses.push({
              skill: topic,
              description: `Struggles with ${topic} (${Math.round(topicAccuracy)}% accuracy)`,
              accuracy: topicAccuracy,
            });
          }
        }
      }
    }
  }

  // Sort by accuracy (best strengths first, worst weaknesses first)
  strengths.sort((a, b) => b.accuracy - a.accuracy);
  weaknesses.sort((a, b) => a.accuracy - b.accuracy);

  // Limit to top 3 strengths and top 3 weaknesses
  // Remove accuracy field before returning (not needed in final output)
  return {
    strengths: strengths.slice(0, 3).map(({ accuracy, ...rest }) => rest),
    weaknesses: weaknesses.slice(0, 3).map(({ accuracy, ...rest }) => rest),
  };
}

// Calculate detailed performance by subject for storage
function calculatePerformanceBySubject(questions: any[], answers: Record<string, any>) {
  const performanceBySubject: Record<string, any> = {};

  for (const question of questions) {
    const userAnswer = answers[question.id];
    const details = question.question_details || {};
    const subject = question.subject || "Unknown";
    const topic = question.topic || "Unknown";

    if (!performanceBySubject[subject]) {
      performanceBySubject[subject] = {
        correct: 0,
        total: 0,
        topics: {},
      };
    }

    if (!performanceBySubject[subject].topics[topic]) {
      performanceBySubject[subject].topics[topic] = {
        correct: 0,
        total: 0,
      };
    }

    performanceBySubject[subject].total++;
    performanceBySubject[subject].topics[topic].total++;

    let isCorrect = false;
    if (userAnswer) {
      if (question.question_type === "drag_drop") {
        const correctAnswers = details.qa_pairs?.map((q: any) => q.answer) || [];
        if (
          Array.isArray(userAnswer) &&
          userAnswer.length === correctAnswers.length &&
          userAnswer.every((a, i) => a === correctAnswers[i])
        ) {
          isCorrect = true;
        }
      } else {
        if (userAnswer === details.answer) {
          isCorrect = true;
        }
      }
    }

    if (isCorrect) {
      performanceBySubject[subject].correct++;
      performanceBySubject[subject].topics[topic].correct++;
    }
  }

  return performanceBySubject;
}
