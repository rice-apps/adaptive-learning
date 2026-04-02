'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import logo from '../../assets/logo.png';
import { Search, BellIcon } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EducatorSearchResults from '@/components/educator-search-results';
import StudentProficiencyChart from '@/components/StudentProficiencyChart';

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
  first_name: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const greetingName = 'Instructor';
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
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
        console.log('Dashboard data:', data);
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

  // Fetch search results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(`/api/educator/search?query=${encodeURIComponent(searchQuery)}`);
        const result = await response.json();
        setSearchResults(result.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedWeaknesses = showAllWeaknesses 
    ? dashboardData?.weaknesses || []
    : (dashboardData?.weaknesses || []).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Logo and User Info Row (mobile) / Logo (desktop) */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <Image
              src={logo}
              alt="Logo"
              width={120}
              height={72}
              className="w-[100px] sm:w-[120px] h-auto"
            />

            {/* Mobile: Show avatar and bell in header row */}
            <div className="flex items-center gap-3 sm:hidden">
              <BellIcon className="text-white h-6 w-6" />
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="Instructor"
                />
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm order-3 sm:order-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for lessons, assessments..."
              className="w-full bg-white rounded-full pl-9 text-sm sm:text-base"
            />
          </div>

          {/* Desktop: Avatar and Bell */}
          <div className="hidden sm:flex items-center gap-4 order-2 sm:order-3">
            <BellIcon className="text-white h-7 w-7 md:h-10 md:w-10" />
            <Avatar className="h-10 w-10 md:h-14 md:w-14">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt="Instructor"
              />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
          </div>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Greeting Card */}
        <Card className="rounded-xl">
          <CardContent className="flex flex-col sm:flex-row items-center gap-3 py-3 sm:py-4 px-4 sm:px-5 text-center sm:text-left">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-semibold">Hello {greetingName}!</h1>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-3">
          <Link href="/educator/dashboard">
            <Button
              className="rounded-md text-sm sm:text-base px-3 sm:px-4"
              variant={
                pathname === "/educator/dashboard" ? "default" : "outline"
              }
            >
              Cohort Overview
            </Button>
          </Link>

          <Link href="/educator/students">
            <Button
              className="rounded-md text-sm sm:text-base px-3 sm:px-4"
              variant={
                pathname === "/educator/students" ? "default" : "outline"
              }
            >
              Students
            </Button>
          </Link>

          <Link href="/educator/quizzes">
            <Button
              className="rounded-md"
              variant={pathname === '/educator/quizzes' ? 'default' : 'outline'}
            >
              Quizzes
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-gray-600 shrink-0" />
              <CardTitle className="text-base sm:text-lg">
                Recent Assessment Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : dashboardData?.recentAssessments && dashboardData.recentAssessments.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1">
                {dashboardData.recentAssessments.map((assessment, index) => (
                  <div key={index} className="flex justify-between">
                    <div>
                      <p className="font-medium">{assessment.studentName}</p>
                      <p className="text-sm text-gray-500">{assessment.quizName}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {assessment.score}% · {assessment.timeAgo}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No recent assessments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Proficiency */}
          <Card className="lg:col-span-2">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">
                Student Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="h-48 sm:h-56 md:h-64 flex items-center justify-center text-gray-400 text-sm sm:text-base px-4 sm:px-6">
              Chart goes here
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">
                Cohort Weaknesses
              </CardTitle>
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