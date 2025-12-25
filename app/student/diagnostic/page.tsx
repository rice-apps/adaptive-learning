"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// hacky workaround for mvp, fix later
const EDUCATOR_ID = "98509cc4-36bf-4df0-b4b8-83ddd33eae74";

type QuestionType = "free_response" | "mcq" | "drag_drop";

interface FreeResponseDetails {
  question: string;
  answer: string;
  passage?: string;
}

interface MCQDetails {
  question: string;
  answer: string;
  options: string[];
  passage?: string;
}

interface DragDropDetails {
  options: string[];
  qa_pairs: Array<{
    question: string;
    answer: string;
  }>;
  passage?: string;
}

interface Question {
  id: string;
  created_at: string;
  subject: string;
  topic: string;
  question_type: QuestionType;
  question_details: FreeResponseDetails | MCQDetails | DragDropDetails;
}

export default function QuizzesPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStartTime] = useState(() => Date.now());

  // Answers state - stores answers by question id
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("Questions")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching questions:", error);
        toast.error("Failed to load questions");
        return;
      }

      if (data) {
        setQuestions(data as Question[]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  // Get current answer for the question
  const getCurrentAnswer = () => {
    if (!currentQuestion) return null;
    return answers[currentQuestion.id] || null;
  };

  // Set answer for current question
  const setCurrentAnswer = (value: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  // Validate current question
  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return false;

    const answer = getCurrentAnswer();

    if (currentQuestion.question_type === "free_response") {
      if (!answer || (typeof answer === "string" && !answer.trim())) {
        toast.error("Please enter your answer");
        return false;
      }
    } else if (currentQuestion.question_type === "mcq") {
      if (!answer) {
        toast.error("Please select an option");
        return false;
      }
    } else if (currentQuestion.question_type === "drag_drop") {
      const details = currentQuestion.question_details as DragDropDetails;
      if (
        !answer ||
        !Array.isArray(answer) ||
        answer.length !== details.qa_pairs.length
      ) {
        toast.error("Please answer all questions");
        return false;
      }
      // Check if all dropdowns have selections
      if (answer.some((a: string) => !a || a.trim() === "")) {
        toast.error("Please select an option for all questions");
        return false;
      }
    }

    return true;
  };

  // Handle next button
  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Calculate score on quiz
  const calculateScore = () => {
    let correct = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const details = question.question_details as any;

      if (!userAnswer) continue;

      if (question.question_type === "drag_drop") {
        const correctAnswers = details.qa_pairs.map((q: any) => q.answer);
        if (
          Array.isArray(userAnswer) &&
          userAnswer.every((a, i) => a === correctAnswers[i])
        ) {
          correct++;
        }
      } else {
        if (userAnswer === details.answer) {
          correct++;
        }
      }
    }

    if (questions.length === 0) return 0;
    return Math.round((correct / questions.length) * 100);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentQuestion()) return;

    const quizEndTime = Date.now();
    const timeSpentSeconds = Math.floor((quizEndTime - quizStartTime) / 1000);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You must be logged in to submit this quiz");
        return;
      }

      // Insert completed diagnostic quiz
      const { data, error: insertError } = await supabase
        .from("Quizzes")
        .insert({
          student_id: user.id,
          educator_id: EDUCATOR_ID,
          start_time: new Date(quizStartTime).toISOString(),
          end_time: new Date().toISOString(),
          submitted: true,
          time_spent: timeSpentSeconds,
          score: calculateScore(),
        })
        .select();

      console.log("QUIZ INSERT DATA:", data);
      console.log("QUIZ INSERT ERROR:", insertError);

      if (insertError) {
        toast.error(insertError.message);
        return;
      }

      toast.success("Quiz completed successfully!");
      router.push("/student/dashboard");
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render reading passage if available
  const renderPassage = (passage?: string) => {
    if (!passage) return null;

    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          Reading Passage:
        </p>
        <p className="text-sm text-blue-800 whitespace-pre-wrap">{passage}</p>
      </div>
    );
  };

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const answer = getCurrentAnswer();
    const details = currentQuestion.question_details;

    return (
      <div className="space-y-6">
        {/* Reading Passage */}
        {renderPassage(
          (details as FreeResponseDetails | MCQDetails | DragDropDetails)
            .passage
        )}

        {/* Question Box */}
        <div className="bg-gray-100 rounded-lg p-6 min-h-[200px] flex items-center">
          <div className="w-full">
            <p className="text-gray-400 text-sm mb-2">
              {currentQuestion.subject} - {currentQuestion.topic}
            </p>
            {currentQuestion.question_type === "free_response" && (
              <>
                <p className="text-xl font-semibold">
                  {(details as FreeResponseDetails).question}
                </p>
              </>
            )}
            {currentQuestion.question_type === "mcq" && (
              <>
                <p className="text-xl font-semibold">
                  {(details as MCQDetails).question}
                </p>
              </>
            )}
            {currentQuestion.question_type === "drag_drop" && (
              <p className="text-xl font-semibold">
                Match each item with the correct answer from the dropdowns.
              </p>
            )}
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.question_type === "free_response" && (
            <Textarea
              placeholder="Enter your answer"
              value={(answer as string) || ""}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full min-h-[120px]"
              autoFocus
            />
          )}

          {currentQuestion.question_type === "mcq" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(details as MCQDetails).options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answer === option}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-semibold block text-gray-900">
                      {option}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.question_type === "drag_drop" && (
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="grid grid-cols-2">
                {/* Left Column - Premises */}
                <div className="border-r border-gray-300">
                  {(details as DragDropDetails).qa_pairs.map((pair, index) => (
                    <div
                      key={index}
                      className="p-4 border-b border-gray-300 last:border-b-0 min-h-[80px] flex items-center"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-base font-semibold text-gray-700 mt-0.5">
                          {index + 1}.
                        </span>
                        <p className="text-base text-gray-900 flex-1">
                          {pair.question}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column - Responses with Dropdowns */}
                <div>
                  {(details as DragDropDetails).qa_pairs.map((pair, index) => (
                    <div
                      key={index}
                      className="p-4 border-b border-gray-300 last:border-b-0 min-h-[80px] flex items-center"
                    >
                      <Select
                        value={Array.isArray(answer) ? answer[index] || "" : ""}
                        onValueChange={(value) => {
                          const currentAnswers = Array.isArray(answer)
                            ? [...answer]
                            : [];
                          currentAnswers[index] = value;
                          setCurrentAnswer(currentAnswers);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {(details as DragDropDetails).options.map(
                            (option, optIndex) => (
                              <SelectItem key={optIndex} value={option}>
                                {String.fromCharCode(65 + optIndex)}. {option}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">No questions available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-4xl py-8 px-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gray-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Current Question */}
        {renderQuestion()}

        {/* Navigation Buttons */}
        <div className="flex justify-end items-center mt-8 pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="mr-3"
          >
            Previous
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {currentQuestionIndex === totalQuestions - 1
              ? isSubmitting
                ? "Submitting..."
                : "Submit"
              : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
