import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

export default function StudentDashboard() {
  return (
    // <div className="container mx-auto px-4 py-8">
    <div className="min-h-screen bg-gray-50">

      {/*Sticky Top Gray Header */}
      <div className="bg-gray-100 w-full sticky top-0 z-50 shadow-sm">
          <header className="relative max-w-6xl mx-auto py-4 px-8 flex items-center justify-between">
              {/* Left: Page title */}
              <h1 className="text-lg font-semibold text-gray-800 z-10">
              Student Dashboard
              </h1>

              {/* Center: Search bar absolutely centered */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
              <Input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-white"
              />
              </div>

              {/* Right: Student info + avatar */}
              <div className="flex items-start gap-4 z-10 justify-end">
              <div className="flex flex-col items-center justify-end">
                  <span className="text-sm text-gray-700">Student</span>
                  <Button variant="outline" size="sm" className="mt-1">
                  Edit Profile
                  </Button>
              </div>

              <Avatar className="h-14 w-14">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Student" />
                  <AvatarFallback>IN</AvatarFallback>
              </Avatar>
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
            <h2 className="text-lg font-bold">Course XX Progress </h2>
            <Progress className="mt-2" value={33} />
          </CardContent>
        </Card>

        {/* Dropdown Buttons */}   
        <div className="container @xs:flex-row">
          <h2 className="text-lg font-bold mb-2">Recommended Lessons</h2>

          {/** Button number 1 */}
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

          {/** Button number 2 */}
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
        
          {/** Button number 3 */}
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
        </div>
        


        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 mt-4">
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 mt-4">
          <Card className="md:col-span-2">
            <CardHeader>            
              <CardTitle>Writing Feedback</CardTitle>
            </CardHeader>
            <CardContent className="h-24">

            </CardContent>
          </Card>
          <Card>
            <CardHeader>            
              <CardTitle>Quiz Feedback</CardTitle>
            </CardHeader>            
            <CardContent className="h-48">
              <div className="grid-rows-4 mb-4">
                <Card><CardContent className="h-2" /></Card>
                <Card><CardContent className="h-2" /></Card>
                <Card><CardContent className="h-2" /></Card>
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