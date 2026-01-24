import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QuizCompletionCard from "@/components/quiz-completion";

interface RecentQuizCompletionsProps {
  completedQuizzes: any[];
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
              <QuizCompletionCard key={quiz.id} quiz={quiz} />
            ))}
            <Button className="mt-3 sm:mt-4 w-full text-sm sm:text-base">
              View All
            </Button>
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