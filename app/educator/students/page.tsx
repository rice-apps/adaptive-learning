"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import Image from 'next/image'
import logo from "../../assets/logo.png"
import { useState, useMemo } from 'react'
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

export default function StudentRoster() {
  // Sample student data - in production, this would come from props or API
  const students = [
    { id: 1, name: "Sarah Johnson", progress: 90, engagement: "more than 10 hours", status: "On Track" },
    { id: 2, name: "Angelina Jo", progress: 50, engagement: "more than 5 hours", status: "On Track" },
    { id: 3, name: "Bo Bobbinson", progress: 75, engagement: "more than 7 hours", status: "On Track" },
    { id: 4, name: "Jerry Jones", progress: 40, engagement: "less than 3 hours", status: "At Risk" },
    { id: 5, name: "Michelle Sully ", progress: 55, engagement: "more than 5 hours", status: "On Track" },
    { id: 6, name: "Kerri Watts", progress: 45, engagement: "less than 5 hours", status: "At Risk" },
    { id: 7, name: "Layne Cane", progress: 45, engagement: "less than 5 hours", status: "At Risk" },
    { id: 8, name: "Happy Atpom", progress: 85, engagement: "more than 8 hours", status: "On Track" },
    { id: 9, name: "Heidi King", progress: 10, engagement: "less than 1 hour", status: "At Risk" },
  ]

  // Filter state: 'All' | 'At Risk' | 'Inactive' | 'On Track'
  const [filter, setFilter] = useState<'All' | 'At Risk' | 'Inactive' | 'On Track'>('All')

  // Compute filtered students list
  const filteredStudents = useMemo(() => {
    if (filter === 'All') return students
    if (filter === 'At Risk') return students.filter(s => s.status === 'At Risk')
    if (filter === 'On Track') return students.filter(s => s.status === 'On Track')
    if (filter === 'Inactive') return students.filter(s => s.status === 'Inactive')
    return students
  }, [filter, students])

  return (
    <div className="min-h-screen bg-black-250">
      {/* Sticky Top Black Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold z-10">
            <Image src={logo} alt="My Image" width={120} height={72} />
          </h1>
          
          {/* Center: Search bar absolutely centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <Input
              type="text"
              placeholder="Search for students, topics..."
              className="w-full bg-white rounded-full"
            />
          </div>
          
          {/* Right: Instructor info + avatar */}
          <div className="flex items-start gap-4 z-10 justify-end">
            <div className="flex items-center gap-3 mt-2">
              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>

              {/* Button */}
              <Button size="sm" className="mr-[0px] px-1 py-5 text-2xl bg-black" >Edit Profile</Button>
            </div>
          </div>
        </header>
      </div>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Title and filters section */}
        <div className="mb-6">
          
          
        </div>

        {/* Header/two Big filter buttons */}
            <div className="flex items-center mb-4 pl-[25px]">
              <Button variant="outline" size="lg" className="px-7 py-7 text-lg font-bold text-white bg-black">Cohort Overview</Button>
              <Button
                variant="outline"
                size="lg"
                className="ml-[40px] px-8 py-7 text-lg font-bold text-black border-1"
              >
                Students
              </Button>
            
  
           
          </div>
      
        {/* Students table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">My Students</CardTitle>
          </CardHeader>
          {/* Filter buttons */}
            <div className="flex items-center mb-4 pl-[25px]">
              <Button
                variant="outline"
                size="sm"
                className={`mr-[5px] px-7 py-5 text-sm ${filter === 'All' ? 'bg-[#A3E635] border-0' : ''}`}
                onClick={() => setFilter('All')}
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`ml-[24px] px-7 py-5 text-sm ${filter === 'At Risk' ? 'bg-[#FFE2E2] border-0' : ''}`}
                onClick={() => setFilter('At Risk')}
              >
                At Risk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`ml-[24px] px-7 py-5 text-sm ${filter === 'Inactive' ? 'bg-[#A3E635] border-0' : ''}`}
                onClick={() => setFilter('Inactive')}
              >
                Inactive
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`ml-[24px] px-7 py-5 text-sm ${filter === 'On Track' ? 'bg-[#A3E635] border-0' : ''}`}
                onClick={() => setFilter('On Track')}
              >
                On Track
              </Button>
            </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-solid">
                 
                    <TableHead className="w-[250px]">Student</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                    <TableHead className="w-[100px]">Engagement</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
          
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      
                      <TableCell className="font-medium">
                        <div className="text-black-700 px-4 py-2 rounded-md inline-block">
                          {student.name}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={student.progress} 
                            className="w-[242] h-3.5 [&>div]:bg-[#A3E635]"
                          />
                          <span className="text-sm text-black-600">{student.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">

                        <div className="text-black-700 px-4 py-2 rounded-md inline-block text-sm">
                            {student.engagement} 
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge 
                          variant={student.status === "On Track" ? "outline" : "secondary"}
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
                      
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        
      </main>
    </div>
  )
}