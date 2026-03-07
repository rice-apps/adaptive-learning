"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface QuestionInfo {
  id: string;
  question_type: string | null;
  question_details: Record<string, unknown> | null;
}

interface EnrichedResult {
  id: number;
  question_id: string;
  student_answer: string | null;
  feedback: string | null;
  question_info: QuestionInfo | null;
  is_correct: boolean | null;
}

interface ResultData {
  results: EnrichedResult[];
  score_percent: number | null;
}

interface StudentQuizResultModalProps {
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
  return String(text).slice(0, 100) + (String(text).length > 100 ? "…" : "");
}

function formatStudentAnswer(answer: string | null): string {
  if (answer == null || answer === "") return "(blank)";
  if (typeof answer === "string" && answer.length > 200) {
    return answer.slice(0, 200) + "…";
  }
  return answer;
}

export default function StudentQuizResultModal({
  isOpen,
  onClose,
  quizId,
  quizName,
}: StudentQuizResultModalProps) {
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
          const res = await fetch(`/api/educator/quiz-results/${quizId}`);
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
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quiz Results: {quizName}
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

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading results…
            </div>
          ) : error ? (
            <div className="py-6 px-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          ) : data?.results?.length ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="py-2 px-3 font-medium w-12">#</th>
                    <th className="py-2 px-3 font-medium">Question</th>
                    <th className="py-2 px-3 font-medium">Student Answer</th>
                    <th className="py-2 px-3 font-medium w-24">Result</th>
                    <th className="py-2 px-3 font-medium">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 font-medium">{idx + 1}</td>
                      <td className="py-2 px-3 text-gray-700 max-w-xs">
                        <span className="line-clamp-2">
                          {getQuestionPreview(r.question_info)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 max-w-xs">
                        <span className="line-clamp-2">
                          {formatStudentAnswer(r.student_answer)}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {r.is_correct === true ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Correct
                          </span>
                        ) : r.is_correct === false ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            Incorrect
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <MinusCircle className="h-4 w-4" />
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs max-w-[16rem]">
                        <span className="line-clamp-3">
                          {r.feedback || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
