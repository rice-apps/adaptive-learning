"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { BellIcon, Search } from "lucide-react";
import QuizCompletionCard from "@/components/quiz-completion";
import logo from "../../../assets/logo.webp";

interface Props {
  student: string | null;
  completedQuizzes: any[];
  hasCompletedDiagnostic: boolean;
}

export default function StudentDashboardClient({
  student,
  completedQuizzes,
  hasCompletedDiagnostic,
}: Props) {
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month">("all");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="w-full py-4 px-8 flex items-center justify-between">
          <Image src={logo} alt="Logo" width={120} height={72} />

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              placeholder="      Search for lessons, assessments..."
              className="bg-white rounded-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <BellIcon className="text-white h-8 w-8" />
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {student?.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto p-8">
        {/* Greeting / Progress */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>
                  {student?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl font-bold">
                Hello {student || "Student"}!
              </h1>
            </div>

            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg">COURSE PROGRESS</h2>
              <Badge className="bg-white text-black">33%</Badge>
            </div>

            <Progress value={33} className="[&>div]:bg-lime-400" />
          </CardContent>
        </Card>

        {/* Diagnostic Lock Card */}
        {!hasCompletedDiagnostic && (
          <Card className="mb-8 border-2 border-dashed border-gray-300">
            <CardContent className="py-10 flex flex-col items-center text-center gap-4">
              <h2 className="text-2xl font-semibold">
                Start Your Diagnostic Assessment
              </h2>
              <p className="text-gray-500 max-w-md">
                Complete this one-time quiz to unlock lessons, feedback, and
                progress tracking.
              </p>

              <Link href="/student/quizzes">
                <Button className="bg-black text-white px-8 py-3 text-lg">
                  Start Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recommended Quizzes (Locked Overlay) */}
        <div className="relative mb-10">
          {!hasCompletedDiagnostic && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <p className="text-gray-500 text-sm">
                Complete the diagnostic quiz to unlock this section
              </p>
            </div>
          )}

          <div className={hasCompletedDiagnostic ? "" : "pointer-events-none"}>
            <h2 className="text-lg font-bold mb-4">Recommended Quizzes</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-lime-100 p-2">
                    <Badge className="bg-lime-300 text-black rounded-full">
                      Subject
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center p-4">
                    <div>
                      <h3 className="font-semibold">Lesson Name</h3>
                      <p className="text-gray-400 text-sm">Duration XXX</p>
                    </div>
                    <Button className="bg-black text-white">Start</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Writing Feedback + Quiz Completions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Writing Feedback */}
          <Card className="md:col-span-2">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Writing Feedback</CardTitle>
              <Select
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as any)}
              >
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
                  {feedbacks.map((f) => (
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
                  {completedQuizzes.map((quiz) => (
                    <QuizCompletionCard key={quiz.id} quiz={quiz} />
                  ))}
                  <Button className="mt-4 w-full">View All</Button>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-6">
                  No completed quizzes yet
                </p>
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
    feedback:
      "Strong argument and supporting points. Really great work overall",
  },
];
