"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    performance_by_subject: Record<
      string,
      {
        correct: number;
        total: number;
        topics: Record<string, { correct: number; total: number }>;
      }
    >;
  } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  details: StudentDetails | null;
  loading: boolean;
}

export default function StudentDetailsDialog({
  open,
  onOpenChange,
  student,
  details,
  loading,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-4xl h-[90vh] sm:h-[80vh] p-0 rounded-xl flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>
            {student
              ? `${student.first_name} ${student.last_name}`
              : "Student Details"}
          </DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="relative bg-[#A3E635] px-4 sm:px-6 md:px-8 py-3 shrink-0">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-xl font-bold"
          >
            ×
          </button>

          <h2 className="text-xl sm:text-2xl font-bold capitalize text-black pr-8">
            {student ? `${student.first_name} ${student.last_name}` : ""}
          </h2>

          {details && (
            <p className="mt-1 text-xs sm:text-sm text-black/70">
              <span className="block sm:inline">
                Last Active: {details.lastActive || "No recent activity"}
              </span>
              <span className="hidden sm:inline"> | </span>
              <span className="block sm:inline">
                Total Lessons: {details.totalLessons}
              </span>
            </p>
          )}
        </div>

        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12 sm:py-16 text-gray-500 text-sm sm:text-base">
              Loading student details…
            </div>
          ) : details ? (
            <>
              {/* Diagnostic Results */}
              {details.diagnosticResults && (
                <Card className="p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#4D6A12] mb-3 sm:mb-4">
                    Diagnostic Results
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Score
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#4D6A12]">
                          {details.diagnosticResults.score}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Correct
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {details.diagnosticResults.correct}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Wrong
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-red-600">
                          {details.diagnosticResults.wrong}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      <span className="block sm:inline">
                        Total Questions:{" "}
                        {details.diagnosticResults.total_questions}
                      </span>
                      {details.diagnosticResults.completed_at && (
                        <span className="block sm:inline sm:ml-4">
                          Completed:{" "}
                          {new Date(
                            details.diagnosticResults.completed_at
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Performance by Subject */}
                    {Object.keys(
                      details.diagnosticResults.performance_by_subject || {}
                    ).length > 0 && (
                      <div className="mt-3 sm:mt-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                          Performance by Subject
                        </h4>
                        <div className="space-y-1 sm:space-y-2">
                          {Object.entries(
                            details.diagnosticResults.performance_by_subject
                          ).map(([subject, data]: [string, any]) => {
                            const accuracy =
                              data.total > 0
                                ? Math.round((data.correct / data.total) * 100)
                                : 0;
                            return (
                              <div
                                key={subject}
                                className="flex items-center justify-between text-xs sm:text-sm"
                              >
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Strengths */}
                <Card className="p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#4D6A12] mb-3 sm:mb-4">
                    Top Strengths
                  </h3>

                  {details.strengths.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-400">
                      No strengths recorded
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {details.strengths.map((s, i) => (
                        <div key={i}>
                          <div className="font-medium text-sm sm:text-base">
                            {s.skill}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {s.description}
                          </div>
                          {i < details.strengths.length - 1 && (
                            <hr className="my-2 sm:my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Weaknesses */}
                <Card className="p-4 sm:p-5 rounded-xl sm:rounded-2xl">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#4D6A12] mb-3 sm:mb-4">
                    Top Weaknesses
                  </h3>

                  {details.weaknesses.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-400">
                      No weaknesses recorded
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {details.weaknesses.map((w, i) => (
                        <div key={i}>
                          <div className="font-medium text-sm sm:text-base">
                            {w.skill}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {w.description}
                          </div>
                          {i < details.weaknesses.length - 1 && (
                            <hr className="my-2 sm:my-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Lesson Tracker */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#4D6A12] mb-3 sm:mb-4">
                    Lesson Tracker
                  </h3>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <Select>
                      <SelectTrigger className="w-full sm:w-[140px] rounded-md text-sm">
                        <SelectValue placeholder="Sort by Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Sort by Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select>
                      <SelectTrigger className="w-full sm:w-[160px] rounded-md text-sm">
                        <SelectValue placeholder="Sort by Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Sort by Subject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile: Card-based layout */}
                  <div className="block sm:hidden space-y-3 max-h-[200px] overflow-y-auto">
                    {details.lessonHistory.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">
                        No lessons yet
                      </p>
                    ) : (
                      details.lessonHistory.map((lesson, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {lesson.assignment}
                            </span>
                            <span className="text-xs text-gray-500">
                              {lesson.lastAttempt}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {lesson.feedback}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop: Table layout */}
                  <div className="hidden sm:block max-h-[260px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">
                            Assignment
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Last Attempt
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Feedback
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.lessonHistory.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center text-gray-400 py-8 text-sm"
                            >
                              No lessons yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          details.lessonHistory.map((lesson, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs sm:text-sm">
                                {lesson.assignment}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {lesson.lastAttempt}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {lesson.feedback}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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