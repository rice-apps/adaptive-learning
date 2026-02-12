'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import logo from '../../assets/logo.png';
import { Search, BellIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EducatorSearchResults from '@/components/educator-search-results';

export default function InstructorDashboard() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

    // Debounce - wait 300ms after user stops typing
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold z-10">
            <Image src={logo} alt="My Image" width={120} height={72} />
          </h1>

          <div className="relative w-full max-w-sm" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4 z-10" />
            <Input
              type="text"
              placeholder="Search for lessons, assessments..."
              className="w-full bg-white rounded-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <EducatorSearchResults
              query={searchQuery}
              results={searchResults}
              onClose={() => setSearchQuery('')}
            />
          </div>

          <div className="flex items-start gap-4 z-10 justify-end">
            <div className="flex items-center space-x-4">
              <BellIcon className="text-white h-10 w-10" />
              <Avatar className="h-14 w-14">
                <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
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
              variant={pathname === '/educator/dashboard' ? 'default' : 'outline'}
            >
              Cohort Overview
            </Button>
          </Link>

          <Link href="/educator/students">
            <Button
              className="rounded-md"
              variant={pathname === '/educator/students' ? 'default' : 'outline'}
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
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Sarah Johnson</p>
                <p className="text-sm text-gray-500">Math Quiz 3</p>
              </div>
              <div className="text-sm text-gray-600">95% · 10 min ago</div>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="font-medium">Emily Rodriguez</p>
                <p className="text-sm text-gray-500">Reading Quiz 2</p>
              </div>
              <div className="text-sm text-gray-600">95% · 10 min ago</div>
            </div>
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
              <div className="border rounded-lg p-3">
                <p className="font-medium">Quadratic Equations</p>
                <p className="text-sm text-gray-500">Math · 8 students affected</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium">Verb Conjugation</p>
                <p className="text-sm text-gray-500">English · 6 students affected</p>
              </div>
              <Button className="w-full rounded-full">View All</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}