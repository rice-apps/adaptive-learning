import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeCheckIcon, ChevronRightIcon, BellIcon } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Image from "next/image";
import logo from "../../../assets/logo.webp";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuizCompletionCard from "@/components/quiz-completion";

export default async function StudentDashboard() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get student profile
  const { data: student } = await supabase
    .from("Students")
    .select("profileName")
    .eq("id", user.id)
    .single();

  // Get student's completed quizzes
  const { data: completedQuizzes } = await supabase
    .from("Quizzes")
    .select("id, start_time, end_time, time_spent, submitted")
    .eq("student_id", user.id)
    .not("submitted", "is", null)
    .order("submitted", { ascending: false })
    .limit(3); // Show last 3 quizzes

  const hasCompletedDiagnostic =
    completedQuizzes && completedQuizzes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/*Sticky Top Gray Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-8 flex items-center justify-between">
          {/* Left: Page title */}
          <h1 className="text-lg font-semibold z-10">
            <Image src={logo} alt="My Image" width={120} height={72} />
          </h1>

          {/* Center: Search bar absolutely centered */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
            <Input
              type="text"
              placeholder="      Search for lessons, assessments..."
              className="w-full bg-white rounded-full"
            />
          </div>

          {/* Right: Student info + avatar */}
          <div className="flex items-start gap-4 z-10 justify-end">
            <div className="flex flex-col items-center justify-end"></div>

            <div className="flex items-center space-x-4">
              <BellIcon className="text-white h-10 w-10" />
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="Student"
                />
                <AvatarFallback>
                  {student?.profileName?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto p-8">
        <Card className="w-full mx-auto mb-7">
          <CardContent>
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="Student"
                />
                <AvatarFallback>
                  {student?.profileName?.charAt(0).toUpperCase() || "S"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-3xl font-bold">
                Hello {student?.profileName || "Student"}!
              </h2>
            </div>
            <h2 className="text-lg font-bold flex justify-between items-center">
              COURSE PROGRESS
              <Badge className="bg-white text-black px-3 py-1">33%</Badge>
            </h2>
            <Progress className="[&>div]:bg-lime-400 mt-2" value={33} />
          </CardContent>
        </Card>

        {!hasCompletedDiagnostic && (
          <Card className="mb-8 border-2 border-dashed border-gray-300 bg-white">
            <CardContent className="py-10 flex flex-col items-center text-center gap-4">
              <h2 className="text-2xl font-semibold">
                Start Your Diagnostic Assessment
              </h2>
              <p className="text-gray-500 max-w-md">
                Complete this one-time diagnostic quiz to unlock lessons,
                feedback, and progress tracking. Expected Time: X min
              </p>

              <a href="/student/diagnostic">
                <Button className="bg-black text-white px-8 py-3 text-lg">
                  Start Quiz
                </Button>
              </a>
            </CardContent>
          </Card>
        )}

        <div className="container @xs:flex-row">
          <h2 className="text-lg font-bold mb-2">Recommended Quizzes</h2>
        </div>

        <div className="relative">
          {!hasCompletedDiagnostic && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <p className="text-gray-500 text-sm">
                Complete the diagnostic quiz to unlock your dashboard!
              </p>
            </div>
          )}
          <div className={hasCompletedDiagnostic ? "" : "pointer-events-none"}>
            {/* Top cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 mt-4">
              <Card className="overflow-hidden p-0">
                <CardHeader className="bg-lime-100 p-2">
                  <Badge className="bg-lime-300 text-black rounded-full px-3 py-1">
                    Subject
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-lg">Lesson Name</h3>
                    <p className="text-gray-400 text-sm">Duration XXX</p>
                  </div>
                  <Button className="bg-black text-white px-5 py-2">
                    Start
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden p-0">
                <CardHeader className="bg-lime-100 p-2">
                  <Badge className="bg-lime-300 text-black px-3 py-1">
                    Subject
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-lg">Lesson Name</h3>
                    <p className="text-gray-400 text-sm">Duration XXX</p>
                  </div>
                  <Button className="bg-black text-white px-5 py-2">
                    Start
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden p-0">
                <CardHeader className="bg-lime-100 p-2">
                  <Badge className="bg-lime-300 text-black px-3 py-1">
                    Subject
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-lg">Lesson Name</h3>
                    <p className="text-gray-400 text-sm">Duration XXX</p>
                  </div>
                  <Button className="bg-black text-white px-5 py-2">
                    Start
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Writing and Quiz Feedback Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 mt-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Writing Feedback</CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead></TableHead>
                        Filter:
                        <Button className="ml-3" size="sm" variant="outline">
                          <DropdownMenu>
                            <DropdownMenuTrigger>All Time</DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Date</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Button>
                        <TableHead>
                          Filter:
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(
                                buttonVariants({
                                  variant: "outline",
                                  size: "sm",
                                }),
                                "ml-3"
                              )}
                            >
                              All Time
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Date</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                              <DropdownMenuItem>Date</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacks.map((feedback) => (
                        <TableRow key={feedback.date} className="h-13">
                          <TableCell className="font-medium">
                            {feedback.date}
                          </TableCell>
                          <TableCell>{feedback.assignment}</TableCell>
                          <TableCell>{feedback.feedback}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow></TableRow>
                    </TableBody>
                    <TableFooter></TableFooter>
                  </Table>

                  {/* View all feedback using this button */}
                  <Button className="block ml-auto mt-5">View All</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Quiz Completions</CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <div className="space-y-3">
                    {completedQuizzes && completedQuizzes.length > 0 ? (
                      <>
                        {completedQuizzes.map((quiz) => (
                          <QuizCompletionCard key={quiz.id} quiz={quiz} />
                        ))}
                        <Button className="block mx-auto mt-5 w-full">
                          View All
                        </Button>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No completed quizzes yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const feedbacks = [
  {
    date: "Feb 11, 2025",
    assignment: "Narrative Essay",
    feedback: "Great job using vivid details!",
  },
  {
    date: "Mar 5, 2025",
    assignment: "Personal Essay",
    feedback: "Really insightful writing. Only needs minor improvements...",
  },
  {
    date: "Mar 9, 2025",
    assignment: "Persuasive Essay",
    feedback:
      "Strong argument and supporting points. Really great work overall",
  },
];

export function ItemDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Basic Item</ItemTitle>
          <ItemDescription>
            A simple item with title and description.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline" size="sm" asChild>
        <a href="#">
          <ItemMedia>
            <BadgeCheckIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Your profile has been verified.</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </a>
      </Item>
    </div>
  );
}
