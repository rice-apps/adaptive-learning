'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, BookOpen, ChevronRight } from 'lucide-react';

/* ───────────────────── types ───────────────────── */

interface SubjectScore {
  subject: string;
  score: number;
  maxScore: number;
}

interface AssignedQuiz {
  id: string;
  name?: string | null;
  subject: string;
  questions: string[];
  created_at: string;
  due_date: string | null;
}

interface CompletedQuiz {
  id: string;
  name?: string | null;
  start_time: string | null;
  end_time: string | null;
  time_spent: string | null;
  submitted: string;
}

interface StudentDashboardClientProps {
  studentName: string;
  courseProgress: number;
  hasCompletedDiagnostic: boolean;
  completedQuizzes: CompletedQuiz[];
  assignedQuizzes: AssignedQuiz[];
  subjectScores?: SubjectScore[];
}

/* ──────────── circular progress dial ──────────── */

function ReadinessDial({
  subject,
  score,
  maxScore,
  index,
}: {
  subject: string;
  score: number;
  maxScore: number;
  index: number;
}) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  // Proficiency label
  const proficiency =
    pct >= 0.8
      ? 'Advanced'
      : pct >= 0.6
        ? 'Proficient'
        : pct >= 0.4
          ? 'Developing'
          : 'Beginning';

  const proficiencyColor =
    pct >= 0.8
      ? 'text-emerald-600 bg-emerald-50'
      : pct >= 0.6
        ? 'text-lime-700 bg-lime-50'
        : pct >= 0.4
          ? 'text-amber-700 bg-amber-50'
          : 'text-red-600 bg-red-50';

  // Stroke color matches proficiency
  const strokeColor =
    pct >= 0.8
      ? '#059669'
      : pct >= 0.6
        ? '#65a30d'
        : pct >= 0.4
          ? '#d97706'
          : '#dc2626';

  return (
    <Card
      className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="flex flex-col items-center py-6 px-4 gap-3">
        {/* Subject label – only show on first card or if different */}
        <p className="text-base font-semibold text-gray-800 tracking-tight">
          {subject}
        </p>

        {/* SVG dial */}
        <div className="relative w-28 h-28">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
          >
            {/* background track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* progress arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* score in the center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 leading-none">
              {score}
            </span>
            <span className="text-xs text-gray-400">/{maxScore}</span>
          </div>
        </div>

        {/* proficiency badge */}
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${proficiencyColor}`}
        >
          {proficiency}
        </span>
      </CardContent>
    </Card>
  );
}

/* ──────────────── main dashboard ──────────────── */

export default function StudentDashboardClient({
  studentName,
  hasCompletedDiagnostic,
  completedQuizzes,
  assignedQuizzes,
  subjectScores = [],
}: StudentDashboardClientProps) {
  const router = useRouter();

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const startQuiz = (quizId: string) => {
    router.push(`/student/quiz/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ─── Greeting ─── */}
        <div className="flex items-center gap-4">
          {/* avatar placeholder – swap for real image if available */}
          <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white select-none shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Hello {studentName}!
            </h1>
            {!hasCompletedDiagnostic && (
              <p className="text-sm text-gray-500 mt-0.5">
                Complete your diagnostic to unlock personalized recommendations.
              </p>
            )}
          </div>
        </div>

        {/* ─── Readiness Dials ─── */}
        {subjectScores.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {subjectScores.map((s, i) => (
              <ReadinessDial
                key={s.subject}
                subject={s.subject}
                score={s.score}
                maxScore={s.maxScore}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ─── Assigned Quizzes ─── */}
        {assignedQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Assigned Quizzes
            </h2>

            <div className="space-y-3">
              {assignedQuizzes.map((quiz) => {
                const overdue = isOverdue(quiz.due_date);
                return (
                  <Card
                    key={quiz.id}
                    className={`rounded-xl ${overdue ? 'border-red-300 bg-red-50/60' : ''}`}
                  >
                    <CardContent className="flex items-center justify-between py-4 px-5 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {quiz.name?.trim() || quiz.subject || 'Quiz'}{' '}
                          <span className="text-gray-400 font-normal">
                            · {quiz.questions?.length || 0} Qs
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(quiz.created_at).toLocaleDateString()}
                          </span>
                          {quiz.due_date && (
                            <span
                              className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Due {new Date(quiz.due_date).toLocaleDateString()}
                              {overdue && ' — Overdue'}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={overdue ? 'destructive' : 'default'}
                        onClick={() => startQuiz(quiz.id)}
                        className="shrink-0"
                      >
                        Start
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Recently Completed ─── */}
        {completedQuizzes.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">
              Recently Completed
            </h2>
            <div className="space-y-2">
              {completedQuizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="rounded-xl bg-green-50/60 border-green-200"
                >
                  <CardContent className="flex items-center justify-between py-3 px-5">
                    <div>
                      <p className="font-medium text-gray-900">
                        {quiz.name?.trim() || 'Quiz'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(quiz.submitted).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {quiz.time_spent || '—'}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ─── Empty state ─── */}
        {assignedQuizzes.length === 0 && subjectScores.length === 0 && (
          <Card className="rounded-xl">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Nothing here yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back later for assignments from your educator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}