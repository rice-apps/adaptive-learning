'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Target, AlertTriangle } from 'lucide-react';

interface QuizTemplate {
  id: string;
  name: string;
  questions: string[];
}

interface QuestionBreakdown {
  questionId: string;
  order: number;
  preview: string;
  correctCount: number;
  totalAttempts: number;
  percentCorrect: number | null;
  mostCommonWrongAnswer: string | null;
}

interface AnalyticsData {
  templateName: string;
  assignmentCount: number;
  submittedCount: number;
  averageScorePercent: number | null;
  averageTimeSpent: string | null;
  questionBreakdown: QuestionBreakdown[];
  worstPerformingQuestion: QuestionBreakdown | null;
}

interface QuizAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: QuizTemplate | null;
}

export default function QuizAnalyticsModal({
  isOpen,
  onClose,
  template,
}: QuizAnalyticsModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && template?.id) {
      setError(null);
      setData(null);
      fetchAnalytics();
    }
  }, [isOpen, template?.id]);

  const fetchAnalytics = async () => {
    if (!template?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/educator/quiz-templates/${template.id}/analytics`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load analytics');
        setData(null);
      } else {
        setData(json);
        setError(null);
      }
    } catch {
      setError('Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quiz Analytics: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading analytics...</div>
          ) : error ? (
            <div className="py-6 px-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
          ) : data ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Assignments
                  </p>
                  <p className="text-2xl font-semibold mt-1">
                    {data.assignmentCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total assigned to students
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Submitted
                  </p>
                  <p className="text-2xl font-semibold mt-1">
                    {data.submittedCount}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Completed quizzes
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    Average score
                  </p>
                  <p className="text-2xl font-semibold mt-1">
                    {data.averageScorePercent != null
                      ? `${data.averageScorePercent}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Across all submissions
                  </p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Avg. time spent
                  </p>
                  <p className="text-2xl font-semibold mt-1">
                    {data.averageTimeSpent ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Per completed quiz
                  </p>
                </div>
              </div>

              {/* Worst-performing question */}
              {data.worstPerformingQuestion && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Students struggle most with
                  </p>
                  <p className="text-sm text-amber-900 mt-1 line-clamp-2">
                    Q{data.worstPerformingQuestion.order}: {data.worstPerformingQuestion.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {data.worstPerformingQuestion.percentCorrect}% correct
                    </Badge>
                    {data.worstPerformingQuestion.mostCommonWrongAnswer && (
                      <span className="text-xs text-amber-800">
                        Most common wrong answer: &quot;{data.worstPerformingQuestion.mostCommonWrongAnswer.slice(0, 40)}
                        {data.worstPerformingQuestion.mostCommonWrongAnswer.length > 40 ? '…' : ''}&quot;
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Per-question breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Per-question breakdown
                </h3>
                {data.questionBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500">No question data yet.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                          <th className="py-2 px-3 font-medium w-12">#</th>
                          <th className="py-2 px-3 font-medium">Question</th>
                          <th className="py-2 px-3 font-medium w-24 text-right">% Correct</th>
                          <th className="py-2 px-3 font-medium w-28 text-right">Attempts</th>
                          <th className="py-2 px-3 font-medium max-w-[14rem]">Most common wrong</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.questionBreakdown.map((q) => (
                          <tr
                            key={q.questionId}
                            className={`border-b last:border-b-0 ${
                              data.worstPerformingQuestion?.questionId === q.questionId
                                ? 'bg-amber-50/50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-medium">{q.order}</td>
                            <td className="py-2 px-3 text-gray-700 max-w-xs">
                              <span className="line-clamp-2">{q.preview}</span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {q.percentCorrect != null ? (
                                <span
                                  className={
                                    q.percentCorrect < 50
                                      ? 'text-red-600 font-medium'
                                      : q.percentCorrect >= 80
                                        ? 'text-green-600'
                                        : ''
                                  }
                                >
                                  {q.percentCorrect}%
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {q.correctCount} / {q.totalAttempts}
                            </td>
                            <td className="py-2 px-3 text-gray-500 text-xs max-w-[14rem]">
                              <span className="line-clamp-1">
                                {q.mostCommonWrongAnswer ?? '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {data.submittedCount === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No students have completed this quiz yet. Analytics will appear once submissions are in.
                </p>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
