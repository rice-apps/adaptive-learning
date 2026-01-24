"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import logo from "../../assets/logo.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BellIcon } from "lucide-react";
import StudentDetailsDialog from "./StudentDetailsDialog";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const dynamic = "force-dynamic";

interface Student {
  id: string;
  email: string;
  progress: number;
  status: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
}

interface StudentDetails {
  strengths: Array<{
    skill: string;
    description: string;
  }>;
  weaknesses: Array<{
    skill: string;
    description: string;
  }>;
  lessonHistory: Array<{
    assignment: string;
    lastAttempt: string;
    feedback: string;
    date: string;
  }>;
  lastActive: string;
  totalLessons: number;
}

export default function StudentRoster() {
  const pathname = usePathname();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"all" | "week" | "month">("all");
  const [filter, setFilter] = useState<
    "All" | "At Risk" | "Inactive" | "On Track"
  >("All");

  // Dialog states here
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const openDialogue = async (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
    setDetailsLoading(true);
    setStudentDetails(null); // Clear previous details
    setDetailsError(null);

    try {
      const response = await fetch(
        `/api/educator/students/${student.id}/details`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setStudentDetails(data);
      }
    } catch (err) {
      setDetailsError("Failed to load student details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/educator/students");
        const data = await response.json();

        if (data.error) {
          // If there's an error, set the error state
          setError(data.error);
        } else {
          const formattedStudents: Student[] = data.students.map(
            (student: any) => ({
              id: student.id,
              email: student.email,
              progress: student.progress,
              status: student.status,
              first_name: student.first_name,
              last_name: student.last_name,
              avatar: student.avatar,
            })
          );
          // Set the formatted students state
          setStudents(formattedStudents);
        }
      } catch (err) {
        setError("Failed to load students data");
      } finally {
        //Finished data loading
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    if (filter === "All") return true;
    return student.status === filter;
  });

  if (loading) {
    // Displays Loading... state while waiting for data
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-4 md:px-8 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between">
          <h1 className="text-lg font-semibold z-10 shrink-0">
            <Image src={logo} alt="My Image" width={120} height={72} />
          </h1>

          <div className="relative w-full max-w-sm order-3 md:order-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              type="text"
              placeholder="      Search for lessons, assessments..."
              className="w-full bg-white rounded-full"
            />
          </div>

          <div className="flex items-center gap-4 z-10 order-2 md:order-3">
            <div className="flex items-center space-x-4">
              <BellIcon className="text-white h-8 w-8 md:h-10 md:w-10" />
              <Avatar className="h-10 w-10 md:h-14 md:w-14">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="Instructor"
                />
              </Avatar>
            </div>
          </div>
        </header>
      </div>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Tabs */}
        <div className="flex gap-3">
          <Link href="/educator/dashboard">
            <Button
              className="rounded-md text-sm md:text-base"
              variant={
                pathname === "/educator/dashboard" ? "default" : "outline"
              }
            >
              Cohort Overview
            </Button>
          </Link>

          <Link href="/educator/students">
            <Button
              className="rounded-md text-sm md:text-base"
              variant={
                pathname === "/educator/students" ? "default" : "outline"
              }
            >
              Students
            </Button>
          </Link>
        </div>

        {/* Students table */}
        <Card className="shadow-sm mt-6 md:mt-8 rounded-lg border border-gray-200 py-2 gap-1">
          <CardHeader className="flex items-center justify-between px-4 md:px-6 py-2">
            <CardTitle className="text-xl md:text-2xl font-bold">My Students</CardTitle>
          </CardHeader>

          {/* Filter buttons */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-3 gap-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-6">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 md:h-9 px-3 md:px-5 text-xs md:text-sm ${
                  filter === "All" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("All")}
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 md:h-9 px-3 md:px-5 text-xs md:text-sm ${
                  filter === "At Risk" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("At Risk")}
              >
                At Risk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 md:h-9 px-3 md:px-5 text-xs md:text-sm ${
                  filter === "Inactive" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("Inactive")}
              >
                Inactive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 md:h-9 px-3 md:px-5 text-xs md:text-sm ${
                  filter === "On Track" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("On Track")}
              >
                On Track
              </Button>
            </div>

            <Select
              defaultValue={timeRange}
              onValueChange={(v) => setTimeRange(v as "all" | "week" | "month")}
            >
              <SelectTrigger className="h-8 md:h-9 w-full md:w-35 rounded-md border border-gray-300 bg-gray-100 text-xs md:text-sm pl-3 pr-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sort By Date</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CardContent className="p-4 md:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px] md:w-[260px] text-xs md:text-sm text-gray-500">
                      Student
                    </TableHead>
                    <TableHead className="min-w-[160px] md:w-[280px] text-xs md:text-sm text-gray-500">
                      Progress
                    </TableHead>
                    <TableHead className="hidden lg:table-cell w-[220px] text-sm text-gray-500">
                      Engagement
                    </TableHead>
                    <TableHead className="min-w-[80px] md:w-[100px] text-xs md:text-sm text-gray-500">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      onClick={() => openDialogue(student)}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {/* Student */}
                      <TableCell>
                        <div className="flex items-center gap-2 md:gap-3">
                          <Avatar className="h-8 w-8 md:h-9 md:w-9 shrink-0">
                            <AvatarImage src={student.avatar ?? undefined} />
                            <AvatarFallback className="text-xs md:text-sm">
                              {student.first_name?.[0] || ""}{student.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900 text-sm md:text-base truncate max-w-[120px] md:max-w-none">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                      </TableCell>

                      {/* Progress */}
                      <TableCell>
                        <div className="flex items-center gap-2 md:gap-3">
                          <Progress
                            value={student.progress}
                            className="h-2 md:h-3 w-[80px] md:w-[180px] [&>div]:bg-[#ABFF2C80]"
                          />
                          <span className="text-xs md:text-sm text-gray-700 w-8 md:w-10 text-right">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Engagement - hidden on mobile */}
                      <TableCell className="hidden lg:table-cell text-sm text-gray-700">
                        {student.progress >= 80
                          ? "more than 10 hours"
                          : student.progress >= 60
                          ? "more than 6 hours"
                          : student.progress >= 40
                          ? "more than 5 hours"
                          : "less than 3 hours"}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          className={`rounded-full px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium whitespace-nowrap ${
                            student.status === "On Track"
                              ? "bg-lime-400 text-black"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs md:text-sm text-gray-600 ml-1">
            Showing {filteredStudents.length} of {filteredStudents.length}{" "}
            students
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              ←
            </Button>
            <Button variant="outline" size="sm">
              →
            </Button>
          </div>
        </div>
      </main>
      <StudentDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={selectedStudent}
        details={studentDetails}
        loading={detailsLoading}
      />
    </div>
  );
}