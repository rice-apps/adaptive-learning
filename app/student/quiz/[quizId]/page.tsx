"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TakeQuizPage() {
  const router = useRouter();
  const { quizId } = useParams();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasInvalidChars, setHasInvalidChars] = useState(false);

  useEffect(() => {
    const fetchQuizData = async () => {
      const supabase = createClient();
      const { data: quiz } = await supabase.from("Quizzes").select("*").eq("id", quizId).single();
      
      if (quiz?.questions) {
        const { data: qs } = await supabase.from("Questions").select("*").in("id", quiz.questions);
        const sorted = quiz.questions.map((id: string) => qs?.find(q => q.id === id)).filter(Boolean);
        setQuestions(sorted);
      }
      setIsLoading(false);
    };
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (hasInvalidChars) {
      const timer = setTimeout(() => {
        setHasInvalidChars(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [hasInvalidChars]);

  const validateFreeResponse = (input: string): { isValid: boolean; error?: string } => {
    const trimmed = input.trim();

    if (trimmed.length === 0) {
      return { isValid: false, error: "Answer can't be empty"};
    }

    if (trimmed.length > 5000) {
      return { isValid: false, error: "Answer cannot exceed 5000 characters" };
    }

    // Allow all printable ASCII characters (blocks emojis, weird unicode, control chars)
    const validChars = /^[\x20-\x7E\n\r\t]*$/;
    if (!validChars.test(trimmed)) {
      return { isValid: false, error: "Answer contains unsupported characters (emojis or special symbols)."};
    }

    return {isValid: true};
  };

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const handleNext = async () => {
    if (!currentQ) return;

    // Validate answer
    const answer = answers[currentQ.id];
    if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
      toast.error('Please answer the question before continuing');
      return;
    }

    if (currentQ.question_type === "free_response") {
      const validation = validateFreeResponse(answer);
      if (!validation.isValid) {
        setValidationErrors({...validationErrors, [currentQ.id]: validation.error || "Invalid input"});
        toast.error(validation.error || "Please fix your answer before continuing");
        return;
      }

      const newErrors = {...validationErrors};
      delete newErrors[currentQ.id];
      setValidationErrors(newErrors);


    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to continue');
        setIsSubmitting(false);
        return;
      }

      // Get question details to check if correct
      const questionDetails = typeof currentQ.question_details === 'string'
        ? JSON.parse(currentQ.question_details)
        : currentQ.question_details;

      const correct = answer === questionDetails.answer;
      setIsCorrect(correct);

      // Insert the result for this question
const { data: resultData, error: insertError } = await supabase
.from('Results')
.insert({
  quiz_id: quizId,
  question_id: currentQ.id,
  student_answer: answer,
  student_id: user.id,
})
.select()
.single();

if (insertError || !resultData) {
console.error('Error saving result:', insertError); // This will show the actual error
toast.error(`Failed to save answer: ${insertError?.message || 'Unknown error'}`);
setIsSubmitting(false);
return;
}

      // Generate feedback and wait for it
      const feedback = await generateFeedback(resultData.id, currentQ.id, user.id, answer);
      
      if (feedback) {
        setCurrentFeedback(feedback);
        setShowFeedback(true);
      } else {
        // If feedback generation fails, just move to next
        toast.error('Could not generate feedback, but answer was saved');
        proceedToNext();
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateFeedback = async (
    resultId: string,
    questionId: string,
    studentId: string,
    studentAnswer: any
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/quiz/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId,
          questionId,
          studentId,
          studentAnswer,
        }),
      });
  
      const result = await response.json();
  
      if (result.success && result.feedback) {
        return result.feedback;
      }
  
      return null;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return null;
    }
  };

  const proceedToNext = () => {
    setShowFeedback(false);
    setCurrentFeedback("");
    setIsCorrect(null);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    try {
      const supabase = createClient();
      
      await supabase
        .from("Quizzes")
        .update({ 
          submitted: true, 
          end_time: new Date().toISOString() 
        })
        .eq("id", quizId);

      toast.success("Quiz submitted successfully!");
      router.push("/student/dashboard");
    } catch (error) {
      console.error('Error finishing quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  if (isLoading) return <div className="p-20 text-center">Loading your quiz...</div>;

  const details = typeof currentQ?.question_details === 'string' 
    ? JSON.parse(currentQ.question_details) 
    : currentQ?.question_details;

  // Show feedback screen
  if (showFeedback) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Result Header */}
          <div className={`rounded-3xl p-10 text-center ${
            isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
          }`}>
            <h2 className={`text-4xl font-bold mb-2 ${
              isCorrect ? 'text-green-700' : 'text-orange-700'
            }`}>
              {isCorrect ? '✓ Correct!' : '✗ Not Quite'}
            </h2>
            <p className="text-gray-600">
              {isCorrect ? 'Great job! Keep it up.' : "Let's learn from this together."}
            </p>
          </div>

          {/* Feedback Content */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Personalized Feedback</h3>
              <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentFeedback}
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={proceedToNext}
              className="bg-black text-white px-12 py-6 rounded-2xl font-bold text-lg"
            >
              {currentIdx === questions.length - 1 ? "Finish Quiz" : "Continue to Next Question"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show question screen
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
                disabled={isSubmitting}
              >
                {opt}
              </button>
            ))}

            {currentQ.question_type === "free_response" && (
              <>
                <Textarea 
                  className={`rounded-2xl p-6 min-h-[160px] text-lg ${
                    validationErrors[currentQ.id] 
                      ? 'border-red-300 focus:ring-red-400' 
                      : 'border-zinc-200 focus:ring-lime-400'
                  }`}
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => {
                    const input = e.target.value;

                    if (input.length > 5000) {
                      setValidationErrors({...validationErrors, [currentQ.id]: "Answer cannot exceed 5000 characters"});
                      return; 
                    }
                    // Allow all printable ASCII + newlines/tabs (blocks emojis, weird unicode)
                    const validChars = /^[\x20-\x7E\n\r\t]*$/;

                    // Block invalid characters completely
                    if(!validChars.test(input) && input !== "") {
                      setHasInvalidChars(true);
                      // Don't update the answer - block the invalid character
                      return;
                    }
                    
                    // Valid input - update and clear warnings
                    setHasInvalidChars(false);
                    setAnswers({...answers, [currentQ.id]: input});

                    // Clear validation error for this question if it exists
                    if (validationErrors[currentQ.id]) {
                      const newErrors = {...validationErrors};
                      delete newErrors[currentQ.id];
                      setValidationErrors(newErrors);
                    }
                  }}
                  disabled={isSubmitting}
                />

               {/* Character counter */}
                <div className="text-sm text-gray-500 mt-1">
                  {(answers[currentQ.id] || "").length} / 5000 characters
                </div>

                {/* Red error box - shows on submit */}
                {validationErrors[currentQ.id] && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationErrors[currentQ.id]}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Orange warning box - shows when user tries invalid chars */}
                {hasInvalidChars && (
                  <Alert className="mt-3 border-orange-300 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Invalid characters detected. Only letters, numbers, and basic punctuation (.,!?;:'"()-) are allowed.
                    </AlertDescription>
                  </Alert>
                )}
              </>
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
                      disabled={isSubmitting}
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
          <Button 
            variant="ghost" 
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} 
            disabled={currentIdx === 0 || isSubmitting}
          >
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="bg-black text-white px-10 py-6 rounded-2xl font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Feedback...
              </>
            ) : currentIdx === questions.length - 1 ? (
              "Submit Quiz"
            ) : (
              "Submit Answer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}