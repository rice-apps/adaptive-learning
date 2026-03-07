"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function WritingFeedback() {
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month">("all");

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Writing Feedback</CardTitle>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="h-8 sm:h-9 w-full sm:w-36 rounded-md bg-gray-100 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sort By Date</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Mobile: Card-based layout */}
        <div className="block sm:hidden space-y-3">
          {feedbacks.map((f) => (
            <div
              key={f.date}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-gray-900">
                  {f.assignment}
                </span>
                <span className="text-xs text-gray-500">{f.date}</span>
              </div>
              <p className="text-sm text-gray-600">{f.feedback}</p>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-xs sm:text-sm">Assignment</TableHead>
                <TableHead className="text-xs sm:text-sm">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((f) => (
                <TableRow key={f.date}>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {f.date}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {f.assignment}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm max-w-[200px] md:max-w-none truncate md:whitespace-normal">
                    {f.feedback}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-4">
          <Button className="w-full sm:w-auto text-sm">View All</Button>
        </div>
      </CardContent>
    </Card>
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