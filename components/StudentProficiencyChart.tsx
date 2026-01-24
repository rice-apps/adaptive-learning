"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubjectFilter = "All" | "Math" | "Language Arts" | "Social Studies" | "Science";

interface ChartDataPoint {
  name: string;
  score: number;
}

// Mock data
const mockData: Record<string, ChartDataPoint[]> = {
  All: [
    { name: "Math", score: 85 },
    { name: "Language Arts", score: 78 },
    { name: "Social Studies", score: 92 },
    { name: "Science", score: 88 },
  ],
  Math: [
    { name: "Algebra", score: 82 },
    { name: "Geometry", score: 90 },
    { name: "Calculus", score: 75 },
    { name: "Statistics", score: 88 },
  ],
  "Language Arts": [
    { name: "Reading", score: 85 },
    { name: "Writing", score: 72 },
    { name: "Grammar", score: 80 },
    { name: "Literature", score: 75 },
  ],
  "Social Studies": [
    { name: "History", score: 95 },
    { name: "Geography", score: 90 },
    { name: "Civics", score: 88 },
    { name: "Economics", score: 92 },
  ],
  Science: [
    { name: "Biology", score: 85 },
    { name: "Chemistry", score: 90 },
    { name: "Physics", score: 88 },
    { name: "Earth Science", score: 87 },
  ],
};

export default function StudentProficiencyChart() {
  const [selectedFilter, setSelectedFilter] = useState<SubjectFilter>("All");

  const chartData = mockData[selectedFilter] || [];

  return (
    <div className="w-full space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700">
          Filter by Subject:
        </label>
        <Select value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as SubjectFilter)}>
          <SelectTrigger id="subject-filter" className="w-[180px]">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Math">Math</SelectItem>
            <SelectItem value="Language Arts">Language Arts</SelectItem>
            <SelectItem value="Social Studies">Social Studies</SelectItem>
            <SelectItem value="Science">Science</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                label={{ value: "Score", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#6b7280" } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [`${value}%`, "Score"]}
              />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

