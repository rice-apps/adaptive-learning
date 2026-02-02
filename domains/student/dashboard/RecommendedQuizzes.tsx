import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RecommendedQuizzesProps {
  assignedQuizzes: Quiz[];
  hasCompletedDiagnostic: boolean;
}

export default function RecommendedQuizzes({
  hasCompletedDiagnostic,
}: RecommendedQuizzesProps) {
  return (
    <div className="relative mb-6 sm:mb-8 md:mb-10">
      {!hasCompletedDiagnostic && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg p-4">
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            Complete the diagnostic quiz to unlock this section
          </p>
        </div>
      )}
      <div className={hasCompletedDiagnostic ? "" : "pointer-events-none"}>
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
          Recommended Quizzes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-lime-100 p-2">
                <Badge className="bg-lime-300 text-black rounded-full text-xs sm:text-sm w-fit">
                  Subject
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base">
                    Lesson Name
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Duration XXX
                  </p>
                </div>
                <Button className="bg-black text-white w-full sm:w-auto text-sm shrink-0">
                  Start
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}