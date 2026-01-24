import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

import QuizCompletionCard from "@/components/QuizCompletion";

interface RecentQuizCompletionsProps {
  completedQuizzes: any[];
}

export default function RecentQuizCompletions({completedQuizzes}: RecentQuizCompletionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Quiz Completions</CardTitle>
      </CardHeader>
      <CardContent>
        {completedQuizzes.length > 0 ? (
          <>
            {completedQuizzes.map(quiz => (
              <QuizCompletionCard key={quiz.id} quiz={quiz} />
            ))}
            <Button className="mt-4 w-full">View All</Button>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No completed quizzes yet</p>
        )}
      </CardContent>
    </Card>
  );
}
