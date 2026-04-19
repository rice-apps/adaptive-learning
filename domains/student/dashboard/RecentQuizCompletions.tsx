"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";
import StudentQuizReviewModal from "./StudentQuizReviewModal";

interface RecentQuizCompletionsProps {
  completedQuizzes?: any[]; 
}

export default function RecentQuizCompletions({ completedQuizzes = [] }: RecentQuizCompletionsProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <div className="w-full">
        <Card className="border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-50/50 bg-gray-50/30">
            <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
            <p className="text-gray-500 text-sm mt-1">Your completed quizzes and assessments</p>
          </CardHeader>
          
          <CardContent className="pt-6">
            {!completedQuizzes || completedQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm font-medium">No recent activity</p>
                <p className="text-gray-400 text-xs mt-1">Complete a quiz to see it here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {completedQuizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => setSelectedQuiz({ id: quiz.id, name: quiz.name || "Assessment" })}
                    className="flex flex-col p-4 rounded-xl bg-white border border-gray-200 hover:border-lime-500 hover:shadow-md hover:ring-1 hover:ring-lime-500 transition-all duration-200 text-left cursor-pointer group h-full"
                  >
                    {/* Header: Icon & Title */}
                    <div className="flex items-start gap-3 w-full mb-4">
                      <div className="w-10 h-10 bg-lime-50 rounded-full flex items-center justify-center shrink-0 group-hover:bg-lime-100 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-lime-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate" title={quiz.name}>
                          {quiz.name?.trim() ? quiz.name : "Assessment"}
                        </p>
                        <p className="text-xs text-lime-600 font-medium mt-0.5">Completed</p>
                      </div>
                    </div>
                    
                    {/* Footer: Date aligned to bottom */}
                    <div className="mt-auto pt-3 border-t border-gray-100 w-full flex items-center text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      <span className="truncate">
                        {quiz.end_time
                          ? new Date(quiz.end_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : "Unknown date"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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