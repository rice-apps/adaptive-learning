"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/ui/navbar";
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
import { BellIcon } from "lucide-react";
import StudentDetailsDialog from "./StudentDetailsDialog";
import AssignQuizDialog from "../dashboard/assignQuiz";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [filter, setFilter] = useState <"All" | "At Risk" | "Inactive" | "On Track" >("All");

  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Assign Quiz Dialog states
  const [assignQuizDialogOpen, setAssignQuizDialogOpen] = useState(false);
  const [selectedStudentForQuiz, setSelectedStudentForQuiz] = useState<Student | null>(null);
  const [educatorId, setEducatorId] = useState<string>("");

  useEffect(() => {
    fetchEducatorId();
    fetchStudents();
  }, []);

  const fetchEducatorId = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // In this project, educator ids are the auth user ids (see FK Educators.id -> user_role.user_id)
    setEducatorId(user.id);
  };

  const openDialogue = async (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
    setDetailsLoading(true);
    setStudentDetails(null);
    setDetailsError(null);

    try {
      const response = await fetch(
        `/api/educator/students/${student.id}/details`
      );
      const data = await response.json();

      if (data.error) {
        setDetailsError(data.error);
      } else {
        setStudentDetails(data);
      }
    } catch (err) {
      setDetailsError("Failed to load student details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openAssignQuizDialog = (student: Student, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening details dialog
    setSelectedStudentForQuiz(student);
    setAssignQuizDialogOpen(true);
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/educator/students");
      const data = await response.json();

      if (data.error) {
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
        setStudents(formattedStudents);
      }
    } catch (err) {
      setError("Failed to load students data");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    // Filter by status
    const matchesStatus = filter === "All" || student.status === filter;
    
    // Filter by search term
    const matchesSearch = searchTerm === "" || 
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase())    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex gap-3">
          <Link href="/educator/dashboard">
            <Button
              className="rounded-md"
              variant={
                pathname === "/educator/dashboard" ? "default" : "outline"
              }
            >
              Cohort Overview
            </Button>
          </Link>

          <Link href="/educator/students">
            <Button
              className="rounded-md"
              variant={
                pathname === "/educator/students" ? "default" : "outline"
              }
            >
              Students
            </Button>
          </Link>
        </div>

        <Card className="shadow-sm mt-8 rounded-lg border border-gray-200 py-2 gap-1">
          <CardHeader className="flex items-center justify-between px-6 py-2">
            <CardTitle className="text-2xl font-bold">My Students</CardTitle>
          </CardHeader>

          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-5 text-sm ${
                  filter === "All" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("All")}
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-5 text-sm ${
                  filter === "At Risk" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("At Risk")}
              >
                At Risk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-5 text-sm ${
                  filter === "Inactive" ? "bg-[#ABFF2C80] border-0" : ""
                }`}
                onClick={() => setFilter("Inactive")}
              >
                Inactive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 px-5 text-sm ${
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
              <SelectTrigger className="h-9 w-35 rounded-md border border-gray-300 bg-gray-100 text-sm pl-3 pr-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sort By Date</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[260px] text-sm text-gray-500">
                      Student
                    </TableHead>
                    <TableHead className="w-[280px] text-sm text-gray-500">
                      Progress
                    </TableHead>
                    <TableHead className="w-[220px] text-sm text-gray-500">
                      Engagement
                    </TableHead>
                    <TableHead className="w-[100px] text-sm text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="w-[120px] text-sm text-gray-500">
                      Actions
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatar ?? undefined} />
                            <AvatarFallback>
                              {student.first_name?.[0] || ""}{student.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Progress
                            value={student.progress}
                            className="h-3 w-[180px] [&>div]:bg-[#ABFF2C80]"
                          />
                          <span className="text-sm text-gray-700 w-10 text-right">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-gray-700">
                        {student.progress >= 80
                          ? "more than 10 hours"
                          : student.progress >= 60
                          ? "more than 6 hours"
                          : student.progress >= 40
                          ? "more than 5 hours"
                          : "less than 3 hours"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            student.status === "On Track"
                              ? "bg-lime-400 text-black"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => openAssignQuizDialog(student, e)}
                          className="text-sm"
                        >
                          Assign Quiz
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-600 ml-1">
            Showing {filteredStudents.length} of {students.length}{" "}
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

      {selectedStudentForQuiz && (
        <AssignQuizDialog
          isOpen={assignQuizDialogOpen}
          onClose={() => {
            setAssignQuizDialogOpen(false);
            setSelectedStudentForQuiz(null);
          }}
          studentId={selectedStudentForQuiz.id}
          studentName={`${selectedStudentForQuiz.first_name} ${selectedStudentForQuiz.last_name}`}
          educatorId={educatorId}
        />
      )}
    </div>
  );
}