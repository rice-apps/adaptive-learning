import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { BadgeCheckIcon, ChevronRightIcon, BellIcon } from "lucide-react"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import Image from 'next/image'
import logo from "../../../assets/logo.webp"



export default function StudentDashboard() {
  return (
    // <div className="container mx-auto px-4 py-8">
    <div className="min-h-screen bg-gray-50">

      {/*Sticky Top Gray Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
          <header className="relative w-full py-4 px-8 flex items-center justify-between">
              {/* Left: Page title */}
              {/* TODO: Replace page title with Million Stories Logo */}
              <h1 className="text-lg font-semibold z-10">
                <Image src={logo} alt="My Image" width={120} height={72} />
              </h1>

              {/* Center: Search bar absolutely centered */}
              <div className="relative w-full max-w-sm">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" /> */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
              <Input
                  type="text"
                  placeholder="      Search for lessons, assessments..."
                  className="w-full bg-white rounded-full"
              />
              </div>

              {/* Right: Student info + avatar */}
              <div className="flex items-start gap-4 z-10 justify-end">
              <div className="flex flex-col items-center justify-end">

                  {/* <Button variant="outline" size="sm" className="mt-1">
                  Edit Profile
                  </Button> */}
              </div>

              <div className="flex items-center space-x-4">
                <BellIcon className="text-white h-10 w-10" />
                <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Student" />
                  <AvatarFallback>IN</AvatarFallback>
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
                <AvatarImage src="https://github.com/shadcn.png" alt="Student" />
                <AvatarFallback>IN</AvatarFallback>
              </Avatar>
              <h2 className="text-3xl font-bold">Hello Student!</h2>
            </div>
            <h2 className="text-lg font-bold flex justify-between items-center">COURSE PROGRESS
              <Badge className="bg-white text-black px-3 py-1">
                33%
              </Badge>
            </h2>
            <Progress className="[&>div]:bg-lime-400 mt-2" value={33} />

          </CardContent>
        </Card>

        <div className="container @xs:flex-row">
          <h2 className="text-lg font-bold mb-2">Recommended Lessons</h2>
        </div>

        {/* Dropdown Buttons   

          * Button number 1
          <Button className="mr-4" size="sm" variant="outline">
              <DropdownMenu>
              <DropdownMenuTrigger>Open</DropdownMenuTrigger>
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

          * Button number 2
          <Button className="mr-4" size="sm" variant="outline">
              <DropdownMenu>
              <DropdownMenuTrigger>Open</DropdownMenuTrigger>
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
        
          * Button number 3
          <Button className="mr-4" size="sm" variant="outline">
              <DropdownMenu>
              <DropdownMenuTrigger>Open</DropdownMenuTrigger>
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
        </div> */}
        


        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 mt-4">
          <Card className="overflow-hidden p-0">
            {/* Top Section */}
            <CardHeader className="bg-lime-100 p-2">
              <Badge className="bg-lime-300 text-black rounded-full px-3 py-1">
                Subject
              </Badge>
            </CardHeader>

            {/* Bottom Section */}
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
            {/* Top Section */}
            <CardHeader className="bg-lime-100 p-2">
              <Badge className="bg-lime-300 text-black px-3 py-1">
                Subject
              </Badge>
            </CardHeader>

            {/* Bottom Section */}
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
            {/* Top Section */}
            <CardHeader className="bg-lime-100 p-2">
              <Badge className="bg-lime-300 text-black px-3 py-1">
                Subject
              </Badge>
            </CardHeader>

            {/* Bottom Section */}
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

          {/* <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card> */}
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
                    <TableHead>Filter: 
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-3")}>
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
                      <TableCell className="font-medium">{feedback.date}</TableCell>
                      <TableCell>{feedback.assignment}</TableCell>
                      <TableCell>{feedback.feedback}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow></TableRow>
                </TableBody>
                <TableFooter>
                </TableFooter>
              </Table>

              {/* View all feedback using this button */}
              <Button className="block ml-auto mt-5">View All</Button>

            </CardContent>
          </Card>
          <Card>
            <CardHeader>            
              <CardTitle>Quiz Feedback</CardTitle>
            </CardHeader>            
            <CardContent className="h-full">
              <div className="grid-rows-4 mb-4">
                {/* Quiz 1 */}
                <Item variant="outline" size="sm" className="mb-3" asChild>
                  <a href="#">
                    <ItemContent>
                      <ItemTitle>Quiz 1</ItemTitle>
                    </ItemContent>
                    <Badge className="bg-lime-300 text-black px-3 py-1 rounded-full">
                      XX%
                    </Badge>
                  </a>
                </Item>
                {/* Quiz 2 */}
                <Item variant="outline" size="sm" className="mb-3" asChild>
                  <a href="#">
                    <ItemContent>
                      <ItemTitle>Quiz 2</ItemTitle>
                    </ItemContent>
                    <Badge className="bg-lime-300 text-black px-3 py-1 rounded-full">
                      XX%
                    </Badge>
                  </a>
                </Item>
                {/* Quiz 3 */}
                <Item variant="outline" size="sm" className="mb-3" asChild>
                  <a href="#">
                    <ItemContent>
                      <ItemTitle>Quiz 3</ItemTitle>
                    </ItemContent>
                    <Badge className="bg-lime-300 text-black px-3 py-1 rounded-full">
                      XX%
                    </Badge>
                  </a>
                </Item>

                <Button className="block mx-auto mt-5">View All</Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/** Writing feedback panel */}
        {/** Quiz feedback panel */}
      </main>



    </div>
  )
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
    feedback: "Strong argument and supporting points. Really great work overall",
  },
]




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
  )
}


export function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
        {/*Sticky Top Gray Header */}
        <div className="bg-gray-100 w-full sticky top-0 z-50 shadow-sm">
            <header className="relative max-w-6xl mx-auto py-4 px-8 flex items-center justify-between">
                {/* Left: Page title */}
                <h1 className="text-lg font-semibold text-gray-800 z-10">
                Instructor Dashboard
                </h1>

                {/* Center: Search bar absolutely centered */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
                <Input
                    type="text"
                    placeholder="Search..."
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

                <Avatar className="h-14 w-14">
                    <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
                    <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                </div>
            </header>
        </div>



      {/* Main content area */}
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
            <AvatarFallback>IN</AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-bold">Hello Instructor!</h2>
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
        </div>

        {/* Cohort Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Cohort Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader>
                  <CardTitle>Proficiency</CardTitle>
                </CardHeader>
                <CardContent className="h-40" />
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Engagement</CardTitle>
                </CardHeader>
                <CardContent className="h-40" />
              </Card>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button variant="outline">View All Students</Button>
              <Button variant="outline">Send Message</Button>
              <Button variant="outline">Assign Lessons</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}