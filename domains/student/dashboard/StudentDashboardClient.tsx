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
  studentName,
  completedQuizzes,
  assignedQuizzes,
  hasCompletedDiagnostic,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <StudentDashboardHeader student={studentName} />

      <main className="max-w-6xl mx-auto p-8 space-y-10">
        
        <GreetingCard student={studentName} />

        {/* LOGIC: Only show this card if diagnostic is NOT complete */}
        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        <RecommendedQuizzes 
          assignedQuizzes={assignedQuizzes} 
          hasCompletedDiagnostic={hasCompletedDiagnostic} 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <WritingFeedback />
          </div>
          <div className="md:col-span-1 h-full">
             <RecentQuizCompletions completedQuizzes={completedQuizzes} />
          </div>
        </div>
      </main>
    </div>
  );
}