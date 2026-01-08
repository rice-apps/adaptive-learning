import Link from "next/link";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export default function PromptDiagnosticCard() {
  return (
    <Card className="mb-8 border-2 border-dashed border-gray-300">
      <CardContent className="py-10 flex flex-col items-center text-center gap-4">
        <h2 className="text-2xl font-semibold">Start Your Diagnostic Assessment</h2>
        <p className="text-gray-500 max-w-md">
          Complete this one-time quiz to unlock lessons, feedback, and progress tracking.
        </p>

        <Link href="/student/quizzes">
          <Button className="bg-black text-white px-8 py-3 text-lg">Start Quiz</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
