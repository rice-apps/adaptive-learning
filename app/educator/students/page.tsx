'use client'
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const dynamic = 'force-dynamic'

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
    skill: string
    description: string
  }>
  weaknesses: Array<{
    skill: string
    description: string
  }>
  lessonHistory: Array<{
    assignment: string
    lastAttempt: string
    feedback: string
    date: string
  }>
  lastActive: string
  totalLessons: number
}

export default function StudentRoster() {

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Dialog states here
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  const openDialogue = async (student: Student) => {
    setSelectedStudent(student)
    setDialogOpen(true)
    setDetailsLoading(true)
    setStudentDetails(null) // Clear previous details
    
    try {
      const response = await fetch(`/api/educator/students/${student.id}/details`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setStudentDetails(data)
      }
    } catch (err) {
      setError('Failed to load student details')
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch("/api/educator/students")  
        const data = await response.json()

        if (data.error) {
          // If there's an error, set the error state
          setError(data.error)  
        } 
        else {
          const formattedStudents: Student[] = data.students.map((student: any) => ({
          id: student.id,
          email: student.email,
          progress: student.progress,
          status: student.status,
          name: student.profileName,
          avatar: student.avatar
          }))
          // Set the formatted students state
          setStudents(formattedStudents)  
        }
        }
      catch (err) {
        setError('Failed to load students data')  
      } finally {
        //Finished data loading
        setLoading(false)  
      }
    }

    fetchStudents()
  }, [])  

    const filteredStudents = students.filter(student => {
    if (filterStatus === 'all') return true;
    return student.status.toLowerCase() === filterStatus.toLowerCase(); 
    });

  if (loading) {
     // Diisplays Loading... state while waiting for data
    return <div>Loading...</div> 
  }

  if (error) {
     // Error message if something went wrong
    return <div>{error}</div> 
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Gray Header */}
      <div className="bg-gray-100 w-full sticky top-0 z-50 shadow-sm">
        <header className="relative max-w-7xl mx-auto py-4 px-8 flex items-center justify-between">
          {/* Left: Page title */}
          <div className="flex items-center gap-2 z-10">
            <h1 className="text-lg font-semibold text-gray-800">
              Student Dashboard
            </h1>
            <span className="text-gray-500">|</span>
            <span className="text-sm text-gray-600">Iteration 1</span>
          </div>
          
          {/* Center: Search bar absolutely centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <Input
              type="text"
              placeholder="Search students..."
              className="w-full bg-white"
            />
          </div>
          
          {/* Right: Instructor info + avatar */}
          <div className="flex items-start gap-4 z-10 justify-end">
            <div className="flex flex-col items-center justify-end">
              <span className="text-sm text-gray-700">Instructor</span>
              <Button variant="outline" size="sm" className="mt-1">
                Edit Profile
              </Button>
            </div>
            <Avatar className="h-10 w-10 mt-2">
              <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
          </div>
        </header>
      </div>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Title and filters section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">All Students</h2>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant={filterStatus === "all" ? "default" : "outline"} size="sm" onClick={() =>setFilterStatus("all")}
            >All</Button>
             <Button variant={filterStatus === "On Track" ? "default" : "outline"} size="sm" onClick={() =>setFilterStatus("On Track")}
            >On Track</Button>
             <Button variant={filterStatus === "At Risk" ? "default" : "outline"} size="sm" onClick={() =>setFilterStatus("At Risk")}
            >At Risk</Button>
             <Button variant={filterStatus === "Inactive" ? "default" : "outline"} size="sm" onClick={() =>setFilterStatus("Inactive")}
            >Inactive</Button>
          </div>
        </div>

        {/* Students table */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[250px]">Student Name</TableHead>
                    <TableHead className="w-[300px]">Email</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback className="bg-gray-300">
                  {student.name ? student.name.split(" ").map(n => n[0]).join("") : "?"}
                </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md inline-block">
                          {student.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md inline-block">
                          {student.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.progress} className="w-[140px]" />
                          <span className="bg-[#AEF35A] text-sm text-gray-600">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={student.status === "Active" ? "default" : "secondary"}
                          className={student.status === "Behind" ? "bg-orange-100 text-orange-800" : ""}
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
            Showing {filteredStudents.length} of {filteredStudents.length} students
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </main>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent ? selectedStudent.name : 'Student Details'}
              </DialogTitle>
              {studentDetails && (
                <p className="text-sm text-gray-600">
                  Last Active: {studentDetails.lastActive} | Total Lessons: {studentDetails.totalLessons}
                </p>
              )}
            </DialogHeader>

            {detailsLoading ? (
              <div className="flex justify-center items-center p-12">
                <div>Loading student details...</div>
              </div>
            ) : studentDetails ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Top Strengths */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Top Strengths</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {studentDetails?.strengths?.map((strength, index) => (
                        <div key={index}>
                          <div className="font-medium">{strength.skill}</div>
                          <div className="text-sm text-gray-600">{strength.description}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Top Weaknesses */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Top Weaknesses</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {studentDetails?.weaknesses?.map((weakness, index) => (
                        <div key={index}>
                          <div className="font-medium">{weakness.skill}</div>
                          <div className="text-sm text-gray-600">{weakness.description}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Lesson Tracker */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Lesson Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Last Attempt</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentDetails?.lessonHistory?.map((lesson, index) =>  (
                          <TableRow key={index}>
                            <TableCell>{lesson.assignment}</TableCell>
                            <TableCell>{lesson.lastAttempt}</TableCell>
                            <TableCell>{lesson.feedback}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
    </div>
  )
}