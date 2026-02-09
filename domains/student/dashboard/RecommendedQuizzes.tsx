"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Quiz {
  id: string;
  subject: string;
  questions: string[];
}

interface RecommendedQuizzesProps {
  assignedQuizzes: Quiz[];
  hasCompletedDiagnostic: boolean;
}

export default function RecommendedQuizzes({ assignedQuizzes }: RecommendedQuizzesProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Recommended Quizzes</h2>
      
      {(!assignedQuizzes || assignedQuizzes.length === 0) ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400 italic">
          No quizzes assigned at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignedQuizzes.map((quiz) => (
            <Card key={quiz.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all bg-white">
              
              {/* Green Header Area */}
              <div className="h-24 bg-lime-100/50 p-6 relative">
                <span className="bg-lime-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full text-lime-950 inline-block shadow-sm">
                  {quiz.subject || 'General'}
                </span>
              </div>
              
              {/* Card Body */}
              <CardContent className="p-6 pt-5 flex-1 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                      Quiz Assignment
                    </h3>
                    <p className="text-gray-400 text-xs mt-1.5 font-medium">
                      {quiz.questions?.length || 0} QUESTIONS
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => router.push(`/student/quiz/${quiz.id}`)}
                    className="bg-black text-white rounded-xl px-6 h-10 font-bold text-sm hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
                  >
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}