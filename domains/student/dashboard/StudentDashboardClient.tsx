"use client";

import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecentQuizCompletions from "./RecentQuizCompletions";
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
          <RecentQuizCompletions completedQuizzes={completedQuizzes} />
        </div>
      </main>
    </div>
  );
}
