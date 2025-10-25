import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Top bar */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-semibold text-gray-800">Instructor Dashboard</h1>

        <div className="flex items-center gap-4">
            {/* Stack Instructor label above Edit Profile button */}
            <div className="flex flex-col items-center">
            <span className="text-sm text-gray-700">Instructor</span>
            <Button variant="outline" size="sm" className="mt-1">
                Edit Profile
            </Button>
            </div>

            {/* Avatar */}
            <Avatar className="h-14 w-14">
            <AvatarImage src="" alt="Instructor" />
            <AvatarFallback>IN</AvatarFallback>
            </Avatar>
        </div>
    </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" alt="Instructor" />
            <AvatarFallback>IN</AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-bold">Hello Instructor!</h2>
        </div>

        {/* 3 top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
          <Card><CardContent className="h-24" /></Card>
        </div>

        {/* Cohort Analytics Section */}
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
