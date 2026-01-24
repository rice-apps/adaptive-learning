// app/student/quiz/[quizId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TakeQuizPage() {
  const router = useRouter();
  const { quizId } = useParams();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchQuizData = async () => {
      const supabase = createClient();
      const { data: quiz } = await supabase.from("Quizzes").select("*").eq("id", quizId).single();
      
      if (quiz?.questions) {
        const { data: qs } = await supabase.from("Questions").select("*").in("id", quiz.questions);
        // Sort to match quiz order
        const sorted = quiz.questions.map((id: string) => qs?.find(q => q.id === id)).filter(Boolean);
        setQuestions(sorted);
      }
      setIsLoading(false);
    };
    fetchQuizData();
  }, [quizId]);

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
    else submitQuiz();
  };

  const submitQuiz = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Update Quiz Record
    await supabase.from("Quizzes").update({ 
      submitted: true, 
      end_time: new Date().toISOString() 
    }).eq("id", quizId);

    // 2. Insert Results for analytics
    const results = questions.map(q => ({
      quiz_id: quizId,
      question_id: q.id,
      student_answer: answers[q.id],
      student_id: user?.id
    }));
    await supabase.from("Results").insert(results);

    toast.success("Quiz submitted successfully!");
    router.push("/student/dashboard");
  };

  if (isLoading) return <div className="p-20 text-center">Loading your quiz...</div>;

  // Safe JSON parse for question details
  const details = typeof currentQ?.question_details === 'string' 
    ? JSON.parse(currentQ.question_details) 
    : currentQ?.question_details;

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-gray-100 rounded-full">
            <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-bold text-gray-400">QUESTION {currentIdx + 1} OF {questions.length}</p>
        </div>

        {/* Question Area */}
        <div className="space-y-8">
          <div className="bg-zinc-50 rounded-3xl p-10 border border-zinc-100">
             <p className="text-lime-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
               {currentQ.subject} • {currentQ.topic}
             </p>
             <h2 className="text-2xl font-bold text-zinc-900 leading-tight">
               {currentQ.question_type === "drag_drop" ? "Match the following correctly:" : details.question}
             </h2>
          </div>

          {/* Dynamic Inputs Based on Type */}
          <div className="space-y-4">
            {currentQ.question_type === "mcq" && details.options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => setAnswers({...answers, [currentQ.id]: opt})}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium ${
                  answers[currentQ.id] === opt ? "border-lime-400 bg-lime-50" : "border-zinc-100 hover:border-zinc-200"
                }`}
              >
                {opt}
              </button>
            ))}

            {currentQ.question_type === "free_response" && (
              <Textarea 
                className="rounded-2xl p-6 min-h-[160px] text-lg border-zinc-200 focus:ring-lime-400"
                placeholder="Type your answer here..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => setAnswers({...answers, [currentQ.id]: e.target.value})}
              />
            )}

            {currentQ.question_type === "drag_drop" && (
              <div className="space-y-3">
                {details.qa_pairs.map((pair: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="flex-1 font-bold text-zinc-700">{pair.question}</span>
                    <Select 
                      onValueChange={(val) => {
                        const current = answers[currentQ.id] || [];
                        current[i] = val;
                        setAnswers({...answers, [currentQ.id]: current});
                      }}
                    >
                      <SelectTrigger className="w-[200px] bg-white rounded-lg">
                        <SelectValue placeholder="Select Match" />
                      </SelectTrigger>
                      <SelectContent>
                        {details.options.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-10">
          <Button variant="ghost" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
            Back
          </Button>
          <Button onClick={handleNext} className="bg-black text-white px-10 py-6 rounded-2xl font-bold">
            {currentIdx === questions.length - 1 ? "Submit Quiz" : "Next Question"}
          </Button>
        </div>
      </div>
    </div>
  );
}