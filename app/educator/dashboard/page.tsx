"use client";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import logo from "../../assets/logo.png";
import { Search, BellIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { timeAgo } from "@/lib/utils/timeAgo";

type StudentWithDiagnostic = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  diagnostic_results: {
    score?: number | null;
    completed_at?: string | null;
  } | null;
};

export default function InstructorDashboard() {
  const pathname = usePathname();
  const [students, setStudents] = useState<StudentWithDiagnostic[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [, setTick] = useState(0); // forces periodic re-render so timeAgo stays fresh

  useEffect(() => {
    const intervalId = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecent() {
      setLoadingRecent(true);
      setRecentError(null);

      try {
        const res = await fetch("/api/educator/students", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json?.error) {
          throw new Error(json?.error || "Failed to load recent assessments");
        }

        const rawStudents = Array.isArray(json?.students) ? json.students : [];

        const normalized: StudentWithDiagnostic[] = rawStudents.map((s: any) => ({
          id: String(s.id),
          first_name: s.first_name ?? null,
          last_name: s.last_name ?? null,
          diagnostic_results: s.diagnostic_results ?? null,
        }));

        if (!cancelled) setStudents(normalized);
      } catch (e) {
        if (!cancelled) {
          setStudents([]);
          setRecentError(e instanceof Error ? e.message : "Failed to load recent assessments");
        }
      } finally {
        if (!cancelled) setLoadingRecent(false);
      }
    }

    fetchRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  const recentAssessments = useMemo(() => {
    const rows = students
      .map((s) => {
        const completedAt = s.diagnostic_results?.completed_at ?? null;
        if (!completedAt) return null;
        const score = s.diagnostic_results?.score ?? null;
        const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Student";
        return {
          studentName: name,
          assessmentName: "Diagnostic",
          completedAt,
          score,
        };
      })
      .filter(Boolean) as Array<{
      studentName: string;
      assessmentName: string;
      completedAt: string;
      score: number | null;
    }>;

    rows.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    return rows.slice(0, 5);
  }, [students]);

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
            {loadingRecent ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : recentError ? (
              <div className="text-sm text-red-600">{recentError}</div>
            ) : recentAssessments.length === 0 ? (
              <div className="text-sm text-gray-500">No recent assessments yet.</div>
            ) : (
              recentAssessments.map((a) => (
                <div key={`${a.studentName}-${a.completedAt}`} className="flex justify-between">
                  <div>
                    <p className="font-medium">{a.studentName}</p>
                    <p className="text-sm text-gray-500">{a.assessmentName}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {(typeof a.score === "number" ? `${a.score}%` : "—")} · {timeAgo(a.completedAt)}
                  </div>
                </div>
              ))
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
