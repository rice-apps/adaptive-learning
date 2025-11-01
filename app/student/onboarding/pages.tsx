import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X } from "lucide-react"

export default function OnboardingProfile() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-100 w-full">
        <header className="max-w-6xl mx-auto py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            Basic Profile Info
          </h1>
          <span className="text-sm text-gray-600">Onboarding</span>
        </header>
      </div>
      {/* Main content */}
      <main className="max-w-4xl mx-auto p-8">
        <Card className="bg-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center space-y-4">
              <Label className="text-sm font-medium text-gray-700">Profile photo</Label>
              <Avatar className="h-32 w-32 bg-gray-200">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="bg-gray-200">
                  <Upload className="h-8 w-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-sm">
                  Upload Photo
                </Button>
                <Button variant="ghost" size="sm" className="text-sm text-gray-500">
                  Delete Photo
                </Button>
              </div>
            </div>

            {/* Name Section */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Type Name"
                className="w-full"
              />
            </div>

            {/* Career Interests Section */}
            <div className="space-y-2">
              <Label htmlFor="career-interests" className="text-sm font-medium text-gray-700">
                Career Interests
              </Label>
              <Textarea
                id="career-interests"
                placeholder="Tell us about your career goals..."
                className="w-full min-h-[100px] resize-none"
              />
            </div>

            {/* Goals for BMS Section */}
            <div className="space-y-2">
              <Label htmlFor="goals" className="text-sm font-medium text-gray-700">
                Goals for being in BMS
              </Label>
              <Textarea
                id="goals"
                placeholder="Tell us what you hope to achieve..."
                className="w-full min-h-[100px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" className="px-6">
                Back
              </Button>
              <Button className="px-6 bg-blue-600 hover:bg-blue-700 text-white">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}