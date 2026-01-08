import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";

interface RecommendedQuizzesProps {
  hasCompletedDiagnostic: boolean;
}

export default function RecommendedQuizzes({hasCompletedDiagnostic}: RecommendedQuizzesProps) {
  
  return (
    <div className="relative mb-10">
      {!hasCompletedDiagnostic && (
        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <p className="text-gray-500 text-sm">Complete the diagnostic quiz to unlock this section</p>
        </div>
      )}

      <div className={hasCompletedDiagnostic ? "" : "pointer-events-none"}>
        <h2 className="text-lg font-bold mb-4">Recommended Quizzes</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-lime-100 p-2">
                <Badge className="bg-lime-300 text-black rounded-full">Subject</Badge>
              </CardHeader>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h3 className="font-semibold">Lesson Name</h3>
                  <p className="text-gray-400 text-sm">Duration XXX</p>
                </div>
                <Button className="bg-black text-white">Start</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
