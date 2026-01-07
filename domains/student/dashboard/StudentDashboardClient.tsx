"use client";

import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select";
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from "@/components/ui/table";

import QuizCompletionCard from "@/components/quiz-completion";
import GreetingCard from "./GreetingCard";
import PromptDiagnosticCard from "./PromptDiagnosticCard";
import RecommendedQuizzes from "./RecommendedQuizzes";
import StudentDashboardHeader from "./StudentDashboardHeader";

interface Props {
  student: string | null;
  completedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({student, completedQuizzes, hasCompletedDiagnostic}: Props) {
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month">("all");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <StudentDashboardHeader student={student} />

      <main className="max-w-6xl mx-auto p-8">
        {/* Greeting / Progress */}
        <GreetingCard student={student} />

        {/* Diagnostic Lock Card */}
        {!hasCompletedDiagnostic && <PromptDiagnosticCard />}

        {/* Recommended Quizzes (Locked Overlay) */}
        <RecommendedQuizzes hasCompletedDiagnostic={hasCompletedDiagnostic} />

        {/* Writing Feedback + Quiz Completions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Writing Feedback */}
          <Card className="md:col-span-2">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Writing Feedback</CardTitle>
              <Select value={timeRange} onValueChange={v => setTimeRange(v as any)}>
                <SelectTrigger className="h-9 w-36 rounded-md bg-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sort By Date</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map(f => (
                    <TableRow key={f.date}>
                      <TableCell>{f.date}</TableCell>
                      <TableCell>{f.assignment}</TableCell>
                      <TableCell>{f.feedback}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button className="ml-auto mt-4">View All</Button>
            </CardContent>
          </Card>

          {/* Recent Quiz Completions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Completions</CardTitle>
            </CardHeader>
            <CardContent>
              {completedQuizzes.length > 0 ? (
                <>
                  {completedQuizzes.map(quiz => (
                    <QuizCompletionCard key={quiz.id} quiz={quiz} />
                  ))}
                  <Button className="mt-4 w-full">View All</Button>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">No completed quizzes yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

const feedbacks = [
  {
    date: "Feb 11, 2025",
    assignment: "Narrative Essay",
    feedback: "Great job using vivid details!",
  },
  {
    date: "Mar 5, 2025",
    assignment: "Personal Essay",
    feedback: "Really insightful writing. Only needs minor improvements...",
  },
  {
    date: "Mar 9, 2025",
    assignment: "Persuasive Essay",
    feedback: "Strong argument and supporting points. Really great work overall",
  },
];
