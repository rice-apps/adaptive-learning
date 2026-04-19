"use client";

import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecentQuizCompletions from "./RecentQuizCompletions";
import RecommendedQuizzes from "./RecommendedQuizzes";
import StudentDashboardHeader from "./StudentDashboardHeader";
//import WritingFeedback from "./WritingFeedback";

interface Props {
  studentName: string;
  courseProgress: number;
  completedQuizzes: any[];
  assignedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({
  studentName,
  courseProgress,
  completedQuizzes,
  assignedQuizzes,
  hasCompletedDiagnostic,
}: Props) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <StudentDashboardHeader student={studentName} />

      <main className="max-w-6xl mx-auto p-8 space-y-10">
        
        <GreetingCard student={studentName} courseProgress={courseProgress} />

        {/* LOGIC: Only show this card if diagnostic is NOT complete */}
        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        <RecommendedQuizzes 
          assignedQuizzes={assignedQuizzes} 
          hasCompletedDiagnostic={hasCompletedDiagnostic} 
        />
        
        {/* If you want to use WritingFeedback later, you can place it here:
          <WritingFeedback />
        */}

        {/* Removed the restrictive 1/3 grid wrapper so this can take full width */}
        <RecentQuizCompletions completedQuizzes={completedQuizzes} />
        
      </main>
    </div>
  );
}