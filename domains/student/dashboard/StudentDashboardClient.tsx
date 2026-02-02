"use client";
import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecentQuizCompletions from "./RecentQuizCompletions";
import RecommendedQuizzes from "./RecommendedQuizzes";
import StudentDashboardHeader from "./StudentDashboardHeader";
import WritingFeedback from "./WritingFeedback";

interface Props {
  studentName: string;
  completedQuizzes: any[];
  assignedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({
  student,
  completedQuizzes,
  hasCompletedDiagnostic,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <StudentDashboardHeader student={studentName} />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Greeting / Progress */}
        <GreetingCard student={student} />

        {/* LOGIC: Only show this card if diagnostic is NOT complete */}
        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        <RecommendedQuizzes 
          assignedQuizzes={assignedQuizzes} 
          hasCompletedDiagnostic={hasCompletedDiagnostic} 
        />

        {/* Writing Feedback + Quiz Completions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Writing Feedback */}
          <WritingFeedback />

          {/* Recent Quiz Completions */}
          <RecentQuizCompletions completedQuizzes={completedQuizzes} />
        </div>
      </main>
    </div>
  );
}