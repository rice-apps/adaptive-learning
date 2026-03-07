"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, XCircle, MessageSquare } from "lucide-react";

interface QuestionInfo {
  id: string;
  question_type: string | null;
  question_details: Record<string, unknown> | null;
}

interface EnrichedResult {
  id: number;
  question_id: string;
  student_answer: string | null;
  student_answer_json?: unknown;
  feedback: string | null;
  question_info: QuestionInfo | null;
  is_correct: boolean | null;
}

interface ResultData {
  results: EnrichedResult[];
  score_percent: number | null;
}

interface StudentQuizReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizName: string;
}

function getQuestionPreview(q: QuestionInfo | null): string {
  if (!q?.question_details || typeof q.question_details !== "object")
    return "—";
  const d = q.question_details as Record<string, unknown>;
  const text =
    (d.question as string) ||
    (d.prompt as string) ||
    (d.instruction as string) ||
    "—";
  return String(text);
}

function formatStudentAnswer(r: EnrichedResult): string {
  const json = r.student_answer_json;
  if (json != null && typeof json === "object") {
    if ("essay" in json && typeof (json as { essay?: string }).essay === "string") {
      return (json as { essay: string }).essay;
    }
    if (Array.isArray(json)) {
      return json.map((v) => String(v)).join(", ");
    }
  }
  const answer = r.student_answer;
  if (answer == null || answer === "") return "(blank)";
  return answer;
}

export default function StudentQuizReviewModal({
  isOpen,
  onClose,
  quizId,
  quizName,
}: StudentQuizReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      setError(null);
      setData(null);
      const fetchResults = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/student/quiz-results/${quizId}`);
          const json = await res.json();
          if (!res.ok) {
            setError(json.error || "Failed to load results");
            setData(null);
          } else {
            setData(json);
            setError(null);
          }
        } catch {
          setError("Failed to load results");
          setData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [isOpen, quizId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Answers & Feedback: {quizName}
            {data?.score_percent != null && (
              <Badge
                variant="outline"
                className={`ml-2 ${
                  data.score_percent >= 80
                    ? "border-green-300 bg-green-50 text-green-800"
                    : data.score_percent >= 50
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-red-300 bg-red-50 text-red-800"
                }`}
              >
                {data.score_percent}%
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading your answers…
            </div>
          ) : error ? (
            <div className="py-6 px-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          ) : data?.results?.length ? (
            <div className="space-y-4">
              {data.results.map((r, idx) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Question {idx + 1}
                    </span>
                    {r.is_correct === true ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        Correct
                      </span>
                    ) : r.is_correct === false ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                        <XCircle className="h-4 w-4 shrink-0" />
                        Incorrect
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {getQuestionPreview(r.question_info)}
                  </p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Your answer
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      {formatStudentAnswer(r)}
                    </p>
                  </div>
                  {r.feedback && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        AI Feedback
                      </p>
                      <p className="text-sm text-gray-700 bg-blue-50/80 rounded-lg p-3 border border-blue-100">
                        {r.feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              No results found for this quiz.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
