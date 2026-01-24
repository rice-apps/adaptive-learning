import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PromptDiagnosticCard() {
  return (
    <Card className="mb-6 sm:mb-8 border-2 border-dashed border-gray-300">
      <CardContent className="py-6 sm:py-8 md:py-10 px-4 sm:px-6 flex flex-col items-center text-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Start Your Diagnostic Assessment
        </h2>
        <p className="text-gray-500 text-sm sm:text-base max-w-md">
          Complete this one-time quiz to unlock lessons, feedback, and progress
          tracking.
        </p>
        <Link href="/student/diagnostic">
          <Button className="bg-black text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg">
            Start Quiz
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}