"use client";

import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select";
import {Table, TableHeader, TableRow, TableHead, TableBody, TableCell} from "@/components/ui/table";

export default function WritingFeedback() {
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month">("all");

  return (
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
