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

                  {/* Filters */}
                  <div className="flex gap-3 mb-4">
                    <Select>
                      <SelectTrigger className="w-[140px] rounded-md">
                        <SelectValue placeholder="Sort by Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Sort by Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select>
                      <SelectTrigger className="w-[160px] rounded-md">
                        <SelectValue placeholder="Sort by Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Sort by Subject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className="max-h-[260px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Last Attempt</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.lessonHistory.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="text-center text-gray-400 py-8"
                            >
                              No lessons yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          details.lessonHistory.map((lesson, index) => (
                            <TableRow key={index}>
                              <TableCell>{lesson.assignment}</TableCell>
                              <TableCell>{lesson.lastAttempt}</TableCell>
                              <TableCell>{lesson.feedback}</TableCell>
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
