"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentDetails {
  strengths: { skill: string; description: string }[];
  weaknesses: { skill: string; description: string }[];
  lessonHistory: {
    assignment: string;
    lastAttempt: string;
    feedback: string;
  }[];
  lastActive: string;
  totalLessons: number;
  diagnosticResults?: {
    score: number;
    total_questions: number;
    correct: number;
    wrong: number;
    completed_at: string | null;
    performance_by_subject: Record<string, {
      correct: number;
      total: number;
      topics: Record<string, { correct: number; total: number }>;
    }>;
  } | null;
}

interface StudentResult {
  id: number;
  created_at: string;
  student_id: string | null;
  quiz_id: string | null;
  question_id: string | null;
  student_answer: string | null;
  feedback: string | null;
}

interface GroupedQuiz {
  quizId: string;
  questions: StudentResult[];
  completedAt: string;
  allFeedback: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  details: StudentDetails | null;
  loading: boolean;
}

function groupResultsByQuiz(results: StudentResult[]): GroupedQuiz[] {
  const map = new Map<string, StudentResult[]>();

  for (const r of results) {
    if (!r.quiz_id) continue;
    if (!map.has(r.quiz_id)) map.set(r.quiz_id, []);
    map.get(r.quiz_id)!.push(r);
  }

  const grouped: GroupedQuiz[] = [];
  map.forEach((questions, quizId) => {
    const sorted = [...questions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const allFeedback = questions
      .map((q) => q.feedback)
      .filter((f): f is string => !!f && f.trim() !== "");

    grouped.push({
      quizId,
      questions: sorted,
      completedAt: sorted[sorted.length - 1].created_at,
      allFeedback,
    });
  });

  grouped.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return grouped;
}

export default function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
  details,
  loading,
}: Props) {
  const [quizResults, setQuizResults] = useState<GroupedQuiz[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    if (open && student?.id) {
      const fetchResults = async () => {
        setResultsLoading(true);
        try {
          const res = await fetch(`/api/quiz/results/student/${student.id}`);
          if (!res.ok) throw new Error("Failed to fetch results");
          const data: StudentResult[] = await res.json();
          setQuizResults(groupResultsByQuiz(data));
        } catch (err) {
          console.error(err);
          setQuizResults([]);
        } finally {
          setResultsLoading(false);
        }
      };
      fetchResults();
    } else {
      setQuizResults([]);
    }
  }, [open, student?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[80vh] p-0 rounded-xl flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>{student ? `${student.first_name} ${student.last_name}` : "Student Details"}</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="relative bg-[#A3E635] px-8 py-3 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-xl font-bold"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold capitalize text-black">
            {student ? `${student.first_name} ${student.last_name}` : ""}
          </h2>

          {details && (
            <p className="mt-1 text-sm text-black/70">
              Last Active: {details.lastActive || "No recent activity"} | Total
              Lessons: {details.totalLessons}
            </p>
          )}
        </div>

        <div className="px-8 py-5 space-y-5 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-gray-500">
              Loading student details…
            </div>
          ) : details ? (
            <>
              {/* Diagnostic Results */}
              {details.diagnosticResults && (
                <Card className="p-5 rounded-2xl">
                  <h3 className="text-xl font-semibold text-[#4D6A12] mb-4">
                    Diagnostic Results
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Score</div>
                        <div className="text-2xl font-bold text-[#4D6A12]">
                          {details.diagnosticResults.score}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Correct</div>
                        <div className="text-2xl font-bold text-green-600">
                          {details.diagnosticResults.correct}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Wrong</div>
                        <div className="text-2xl font-bold text-red-600">
                          {details.diagnosticResults.wrong}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Questions: {details.diagnosticResults.total_questions}
                      {details.diagnosticResults.completed_at && (
                        <span className="ml-4">
                          Completed: {new Date(details.diagnosticResults.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Performance by Subject */}
                    {Object.keys(details.diagnosticResults.performance_by_subject || {}).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Performance by Subject
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(details.diagnosticResults.performance_by_subject).map(([subject, data]: [string, any]) => {
                            const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                              <div key={subject} className="flex items-center justify-between text-sm">
                                <span className="font-medium">{subject}</span>
                                <span className="text-gray-600">
                                  {data.correct}/{data.total} ({accuracy}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="p-5 rounded-2xl">
                  <h3 className="text-xl font-semibold text-[#4D6A12]">
                    Top Strengths
                  </h3>

                  {details.strengths.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No strengths recorded
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {details.strengths.map((s, i) => (
                        <div key={i}>
                          <div className="font-medium">{s.skill}</div>
                          <div className="text-sm text-gray-500">
                            {s.description}
                          </div>
                          {i < details.strengths.length - 1 && (
                            <hr className="my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Weaknesses */}
                <Card className="p-5 rounded-2xl">
                  <h3 className="text-xl font-semibold text-[#4D6A12]">
                    Top Weaknesses
                  </h3>

                  {details.weaknesses.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No weaknesses recorded
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {details.weaknesses.map((w, i) => (
                        <div key={i}>
                          <div className="font-medium">{w.skill}</div>
                          <div className="text-sm text-gray-500">
                            {w.description}
                          </div>
                          {i < details.weaknesses.length - 1 && (
                            <hr className="my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Lesson Tracker */}
              <Card>
                <CardContent>
                  <h3 className="text-xl font-semibold text-[#4D6A12] mb-4">
                    Lesson Tracker
                  </h3>

                  <div className="max-h-[260px] overflow-y-auto">
                    {resultsLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading results…</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quiz</TableHead>
                            <TableHead>Questions</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Feedback</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quizResults.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center text-gray-400 py-8"
                              >
                                No quiz results yet
                              </TableCell>
                            </TableRow>
                          ) : (
                            quizResults.map((quiz) => (
                              <TableRow key={quiz.quizId}>
                                <TableCell className="font-medium text-sm text-gray-600">
                                  {quiz.quizId.slice(0, 8)}…
                                </TableCell>
                                <TableCell className="text-sm">
                                  {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {new Date(quiz.completedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-[200px]">
                                  {quiz.allFeedback.length > 0
                                    ? quiz.allFeedback.join(" | ")
                                    : "—"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}