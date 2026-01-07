"use client";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

import QuizCompletionCard from "@/components/quiz-completion";
import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecommendedQuizzes from "./RecommendedQuizzes";
import StudentDashboardHeader from "./StudentDashboardHeader";
import WritingFeedback from "./WritingFeedback";

interface Props {
  student: string | null;
  completedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({student, completedQuizzes, hasCompletedDiagnostic}: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <StudentDashboardHeader student={student} />

      <main className="max-w-6xl mx-auto p-8">
        {/* Greeting / Progress */}
        <GreetingCard student={student} />

        {/* Diagnostic Lock Card */}
        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        {/* Recommended Quizzes (Locked Overlay) */}
        <RecommendedQuizzes hasCompletedDiagnostic={hasCompletedDiagnostic} />

        {/* Writing Feedback + Quiz Completions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Writing Feedback */}
          <WritingFeedback />

          {/* Recent Quiz Completions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Completions</CardTitle>
            </CardHeader>
            <CardContent>
              {completedQuizzes.length > 0 ? (
                <>
                  {completedQuizzes.map(quiz => (
                    <QuizCompletionCard key={quiz.id} quiz={quiz} />
                  ))}
                  <Button className="mt-4 w-full">View All</Button>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No completed quizzes yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
