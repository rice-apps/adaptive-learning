"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import StudentQuizReviewModal from "./StudentQuizReviewModal";

interface RecentQuizCompletionsProps {
  // defaulting to empty array to prevent crash
  completedQuizzes?: any[]; 
}

export default function RecentQuizCompletions({ completedQuizzes = [] }: RecentQuizCompletionsProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <Card className="h-full border-gray-100 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Safety check: ensure completedQuizzes exists and has length */}
          {!completedQuizzes || completedQuizzes.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No recent activity found.</p>
          ) : (
            <div className="space-y-4">
              {completedQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={() => setSelectedQuiz({ id: quiz.id, name: quiz.name || "Quiz" })}
                  className="w-full flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors text-left cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-lime-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900">
                      {quiz.name?.trim() ? `${quiz.name} — Completed` : "Quiz Completed"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock size={12} />
                      <span>
                        {quiz.end_time
                          ? new Date(quiz.end_time).toLocaleDateString()
                          : "Unknown Date"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedQuiz && (
        <StudentQuizReviewModal
          isOpen={!!selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
          quizId={selectedQuiz.id}
          quizName={selectedQuiz.name}
        />
      )}
    </>
  );
}