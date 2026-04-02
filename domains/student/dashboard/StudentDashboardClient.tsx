"use client";

import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecentQuizCompletions from "./RecentQuizCompletions";
import RecommendedQuizzes from "./RecommendedQuizzes";
import StudentDashboardHeader from "./StudentDashboardHeader";
import WritingFeedback from "./WritingFeedback";

interface SubjectScore {
  subject: string;
  score: number;
  maxScore: number;
}

interface Props {
  studentName: string;
  courseProgress: number;
  completedQuizzes: any[];
  assignedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
  subjectScores?: SubjectScore[];
}

export default function StudentDashboardClient({
  studentName,
  courseProgress,
  completedQuizzes,
  assignedQuizzes,
  hasCompletedDiagnostic,
  subjectScores = [],
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <StudentDashboardHeader student={studentName} />

      <main className="max-w-6xl mx-auto p-8 space-y-10">
        <GreetingCard student={studentName} subjectScores={subjectScores} />

        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        <RecommendedQuizzes
          assignedQuizzes={assignedQuizzes}
          hasCompletedDiagnostic={hasCompletedDiagnostic}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <WritingFeedback />
          <RecentQuizCompletions completedQuizzes={completedQuizzes} />
        </div>
      </main>
    </div>
  );
}