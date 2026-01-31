"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import logo from "../../assets/logo.png";
import { Search, BellIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface Weakness {
  id: number;
  topic: string;
  subject: string;
  studentCount: number;
}

interface RecentAssessment {
  studentName: string;
  quizName: string;
  score: number;
  timeAgo: string;
}

interface Student {
  id: string;
  email: string;
  progress: number;
  status: string;
  profileName: string;
  avatar: string;
}

interface DashboardData {
  students: Student[];
  total: number;
  weaknesses: Weakness[];
  recentAssessments: RecentAssessment[];
}

export default function InstructorDashboard() {
  const pathname = usePathname();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/educator/dashboard');

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        console.log('Dashboard data:', data); // For debugging
        setDashboardData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const displayedWeaknesses = showAllWeaknesses 
    ? dashboardData?.weaknesses || []
    : (dashboardData?.weaknesses || []).slice(0, 2);

// export default function InstructorDashboard() {
//   const pathname = usePathname();
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

      {/* Main */}
      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Greeting Card */}
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-semibold">Hello Mr. Burns!</h1>
          </CardContent>
        </Card>

        {/* Tabs */}
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

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-gray-600" />
              <CardTitle>Recent Assessment Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : dashboardData?.recentAssessments && dashboardData.recentAssessments.length > 0 ? (
              dashboardData.recentAssessments.slice(0, 2).map((assessment, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="font-medium">{assessment.studentName}</p>
                    <p className="text-sm text-gray-500">{assessment.quizName}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {assessment.score}% · {assessment.timeAgo}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent assessments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proficiency */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Student Proficiency</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-gray-400">
              Chart goes here
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Weaknesses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">
                  Loading...
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-8">
                  {error}
                </div>
              ) : displayedWeaknesses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No weaknesses found
                  <p className="text-xs mt-2">Students are doing great! 🎉</p>
                </div>
              ) : (
                <>
                  {displayedWeaknesses.map((weakness) => (
                    <div key={weakness.id} className="border rounded-lg p-3">
                      <p className="font-medium">{weakness.topic}</p>
                      <p className="text-sm text-gray-500">
                        {weakness.subject} · {weakness.studentCount} student{weakness.studentCount !== 1 ? 's' : ''} affected
                      </p>
                    </div>
                  ))}
                  {dashboardData && dashboardData.weaknesses.length > 2 && (
                    <Button 
                      className="w-full rounded-full"
                      onClick={() => setShowAllWeaknesses(!showAllWeaknesses)}
                    >
                      {showAllWeaknesses ? "Show Less" : "View All"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
