import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

interface RecentQuizCompletionsProps {
  // defaulting to empty array to prevent crash
  completedQuizzes?: any[]; 
}

export default function RecentQuizCompletions({ completedQuizzes = [] }: RecentQuizCompletionsProps) {
  return (
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
              <div key={quiz.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-lime-500 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-gray-900">Quiz Completed</p>
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
        )}
      </CardContent>
    </Card>
  );
}