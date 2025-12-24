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

export const dynamic = "force-dynamic";

interface Student {
  id: string;
  email: string;
  progress: number;
  status: string;
  name: string;
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
              name: student.profileName,
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
    // Diisplays Loading... state while waiting for data
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold z-10">
            <Image src={logo} alt="My Image" width={120} height={72} />
          </h1>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              type="text"
              placeholder="      Search for lessons, assessments..."
              className="w-full bg-white rounded-full"
            />
          </div>

          <div className="flex items-start gap-4 z-10 justify-end">
            <div className="flex flex-col items-center justify-end"></div>

            <div className="flex items-center space-x-4">
              <BellIcon className="text-white h-10 w-10" />
              <Avatar className="h-14 w-14">
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
      <main className="max-w-7xl mx-auto p-8">
        {/* Title and filters section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            All Students
          </h2>

          {/* Filter buttons */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant={filter === "All" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("All")}
            >
              All
            </Button>
            <Button
              variant={filter === "On Track" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("On Track")}
            >
              On Track
            </Button>
            <Button
              variant={filter === "At Risk" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("At Risk")}
            >
              At Risk
            </Button>
            <Button
              variant={filter === "Inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("Inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Students table */}
        <Card className="shadow-sm mt-8 rounded-lg border border-gray-200 py-2 gap-1">
          <CardHeader className="flex items-center justify-between px-6 py-2">
            <CardTitle className="text-2xl font-bold">My Students</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Filter:
              </span>
              <Select
                defaultValue={timeRange}
                onValueChange={(v) =>
                  setTimeRange(v as "all" | "week" | "month")
                }
              >
                <SelectTrigger className="h-8 w-25 rounded-full border border-gray-300 bg-gray-100 text-sm pl-3 pr-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          {/* Filter buttons */}
          <div className="flex items-center mb-0 px-6">
            <Button
              variant="outline"
              size="sm"
              className={`mr-3 px-5 py-2 text-sm ${
                filter === "All" ? "bg-[#A3E635] border-0" : ""
              }`}
              onClick={() => setFilter("All")}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`ml-4 px-5 py-2 text-sm ${
                filter === "At Risk" ? "bg-[#FFE2E2] border-0" : ""
              }`}
              onClick={() => setFilter("At Risk")}
            >
              At Risk
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`ml-4 px-5 py-2 text-sm ${
                filter === "Inactive" ? "bg-[#A3E635] border-0" : ""
              }`}
              onClick={() => setFilter("Inactive")}
            >
              Inactive
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`ml-4 px-5 py-2 text-sm ${
                filter === "On Track" ? "bg-[#A3E635] border-0" : ""
              }`}
              onClick={() => setFilter("On Track")}
            >
              On Track
            </Button>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-solid">
                    <TableHead className="w-[250px] pl-6 text-sm text-gray-500">
                      Student
                    </TableHead>
                    <TableHead className="w-[300px] text-center text-sm text-gray-500">
                      Progress
                    </TableHead>
                    <TableHead className="w-[220px] pl-4 text-sm text-gray-500 text-left">
                      Engagement
                    </TableHead>
                    <TableHead className="w-[120px] pl-4 text-sm text-gray-500 text-left">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={student.avatar ?? undefined}
                            alt={student.name}
                          />
                          <AvatarFallback className="bg-gray-300">
                            {student.name
                              ? student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="text-black px-4 py-2 rounded-md inline-block">
                          {student.name}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress
                            value={student.progress}
                            className="w-[242px] h-3.5 [&>div]:bg-[#A3E635]"
                          />
                          <span className="text-sm text-black-600">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={student.progress}
                            className="w-[140px]"
                          />
                          <span className="bg-[#AEF35A] text-sm text-gray-600">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="pl-4">
                        <Badge
                          variant={
                            student.status === "On Track"
                              ? "outline"
                              : "secondary"
                          }
                          className={
                            (student.status === "On Track"
                              ? "bg-[#A3E635] border-0 text-gray-800"
                              : student.status === "At Risk"
                              ? "bg-[#FFE2E2] text-orange-800"
                              : "") + " text-sm"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                          onClick={() => openDialogue(student)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination or additional controls can go here */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {filteredStudents.length}{" "}
            students
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
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
