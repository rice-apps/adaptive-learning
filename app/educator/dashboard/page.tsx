import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <div className="bg-black text-white sticky top-0 z-50">
        <header className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left */}
          <div className="font-semibold text-lg">8 Million Stories</div>

          {/* Center */}
          <div className="w-full max-w-lg mx-6">
            <Input
              placeholder="Search for students, topics..."
              className="bg-white text-black"
            />
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <span>🔔</span>
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
          </div>
        </header>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Greeting Card */}
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-4 py-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold">Hello Mr. Burns!</h1>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-3">
          <Button className="rounded-full">Cohort Overview</Button>
          <Button variant="outline" className="rounded-full">
            Students
          </Button>
        </div>

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessment Results</CardTitle>
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
  )
}