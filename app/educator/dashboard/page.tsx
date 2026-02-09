"use client";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/ui/navbar";
import { BellIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InstructorDashboard() {
  const pathname = usePathname();
  const [instructorName, setInstructorName] = useState<string>("");

  useEffect(() => {
    const loadInstructorName = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const metadata = user.user_metadata ?? {};
      const nameFromMetadata =
        [metadata.first_name, metadata.last_name].filter(Boolean).join(" ") ||
        metadata.full_name ||
        metadata.name;
      const fallbackName = user.email?.split("@")[0];

      setInstructorName((nameFromMetadata || fallbackName || "").trim());
    };

    loadInstructorName();
  }, []);

  const greetingName = useMemo(() => {
    return instructorName.length > 0 ? instructorName : "there";
  }, [instructorName]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main */}
      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Greeting Card */}
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-semibold">Hello {greetingName}!</h1>
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
                <p className="text-sm text-gray-500">
                  Math · 8 students affected
                </p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="font-medium">Verb Conjugation</p>
                <p className="text-sm text-gray-500">
                  English · 6 students affected
                </p>
              </div>
              <Button className="w-full rounded-full">View All</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
