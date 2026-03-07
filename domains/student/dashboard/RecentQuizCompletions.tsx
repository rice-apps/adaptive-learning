import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuizCompletionCard from "@/components/QuizCompletion";

interface RecentQuizCompletionsProps {
  // defaulting to empty array to prevent crash
  completedQuizzes?: any[]; 
}

export default function RecentQuizCompletions({
  completedQuizzes,
}: RecentQuizCompletionsProps) {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">
          Recent Quiz Completions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {completedQuizzes.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {completedQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-lime-500 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-gray-900">
                    {quiz.name?.trim() ? `${quiz.name} — Completed` : 'Quiz Completed'}
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-gray-500 text-center py-4 sm:py-6">
            No completed quizzes yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}