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

export default function InstructorDashboard() {
  const pathname = usePathname();

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
            <h1 className="text-lg sm:text-xl font-semibold">
              Hello Mr. Burns!
            </h1>
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
        </div>

        {/* Recent Assessments */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4 text-gray-600 shrink-0" />
              <CardTitle className="text-base sm:text-lg">
                Recent Assessment Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <div>
                <p className="font-medium text-sm sm:text-base">
                  Sarah Johnson
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Math Quiz 3</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                95% · 10 min ago
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <div>
                <p className="font-medium text-sm sm:text-base">
                  Emily Rodriguez
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Reading Quiz 2
                </p>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                95% · 10 min ago
              </div>
            </div>
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

          {/* Weaknesses */}
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">
                Cohort Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              <div className="border rounded-lg p-2 sm:p-3">
                <p className="font-medium text-sm sm:text-base">
                  Quadratic Equations
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Math · 8 students affected
                </p>
              </div>
              <div className="border rounded-lg p-2 sm:p-3">
                <p className="font-medium text-sm sm:text-base">
                  Verb Conjugation
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  English · 6 students affected
                </p>
              </div>
              <Button className="w-full rounded-full text-sm sm:text-base">
                View All
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}