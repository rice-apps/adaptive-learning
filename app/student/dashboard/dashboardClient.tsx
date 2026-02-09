'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, BookOpen, CheckCircle } from 'lucide-react';

interface AssignedQuiz {
  id: string;
  questions: string[];
  created_at: string;
  due_date: string | null;
}

interface CompletedQuiz {
  id: string;
  start_time: string | null;
  end_time: string | null;
  time_spent: string | null;
  submitted: string;
}

interface StudentDashboardClientProps {
  student: string | null;
  completedQuizzes: CompletedQuiz[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({
  student,
  completedQuizzes,
  hasCompletedDiagnostic,
}: StudentDashboardClientProps) {
  const [assignedQuizzes, setAssignedQuizzes] = useState<AssignedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAssignedQuizzes();
  }, []);

  const fetchAssignedQuizzes = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: studentData } = await supabase
      .from('Students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!studentData) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/quiz/assign?studentId=${studentData.id}`);
      const data = await response.json();

      setAssignedQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching assigned quizzes:', error);
      setAssignedQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId: string) => {
    router.push(`/student/quiz/${quizId}`);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Greeting Card */}
        <Card className="rounded-xl">
          <CardContent className="py-6">
            <h1 className="text-3xl font-bold">
              Welcome back, {student || 'Student'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              {hasCompletedDiagnostic
                ? "Keep up the great work! Here's what you need to do next."
                : "Let's get started with your learning journey."}
            </p>
          </CardContent>
        </Card>

        {/* Assigned Quizzes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <CardTitle>Assigned Quizzes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : assignedQuizzes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No quizzes assigned yet.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Check back later for new assignments from your educator.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedQuizzes.map((quiz) => {
                  const overdueStatus = isOverdue(quiz.due_date);
                  
                  return (
                    <div
                      key={quiz.id}
                      className={`border rounded-lg p-5 hover:bg-gray-50 transition ${
                        overdueStatus ? 'border-red-300 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">
                            Quiz - {quiz.questions?.length || 0} Questions
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Assigned: {new Date(quiz.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {quiz.due_date && (
                              <div className={`flex items-center gap-1 ${overdueStatus ? 'text-red-600 font-semibold' : ''}`}>
                                <Clock className="w-4 h-4" />
                                <span>
                                  Due: {new Date(quiz.due_date).toLocaleDateString()}
                                  {overdueStatus && ' (Overdue!)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                          Not Started
                        </span>
                      </div>

                      <Button 
                        onClick={() => startQuiz(quiz.id)} 
                        className="mt-2"
                        variant={overdueStatus ? "destructive" : "default"}
                      >
                        {overdueStatus ? 'Start Now (Overdue)' : 'Start Quiz'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Quizzes Section */}
        {completedQuizzes.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Recently Completed</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedQuizzes.map((quiz) => (
                  <div 
                    key={quiz.id} 
                    className="border rounded-lg p-4 bg-green-50 border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Completed Quiz
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(quiz.submitted).toLocaleDateString()} at{' '}
                          {new Date(quiz.submitted).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Time spent: {quiz.time_spent || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{assignedQuizzes.length}</p>
                <p className="text-sm text-gray-600">Pending Quizzes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{completedQuizzes.length}</p>
                <p className="text-sm text-gray-600">Completed Quizzes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {assignedQuizzes.filter(q => isOverdue(q.due_date)).length}
                </p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}