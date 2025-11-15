'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function StudentOnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    plan: '',
    grade_reading: '',
    grade_math: '',
    current_level: '',
    career_interests: '',
    goals: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/student/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      // Redirect to dashboard
      router.push(data.redirectTo || '/student/dashboard');
      router.refresh(); // Refresh to update any server components
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-100 w-full">
        <header className="max-w-6xl mx-auto py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            Basic Profile Info
          </h1>
          <span className="text-sm text-gray-600">Onboarding</span>
        </header>
      </div>
      
      <main className="max-w-4xl mx-auto p-8">
        <Card className="bg-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">Create Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center space-y-4">
                <Label className="text-sm font-medium text-gray-700">Profile photo</Label>
                <Avatar className="h-32 w-32 bg-gray-200">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback>
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm">
                    Upload Photo
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-gray-500">
                    Delete Photo
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Profile Name. Store it as your first name + last name initial. Ex: MacA *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Type Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <Label htmlFor="plan">Learning Plan</Label>
                <Input
                  id="plan"
                  type="text"
                  placeholder="Your learning plan"
                  value={formData.plan}
                  onChange={(e) => setFormData({...formData, plan: e.target.value})}
                />
              </div>

              {/* Grade Reading */}
              <div className="space-y-2">
                <Label htmlFor="grade_reading">Reading Grade Level</Label>
                <Input
                  id="grade_reading"
                  type="text"
                  placeholder="e.g., 10th grade"
                  value={formData.grade_reading}
                  onChange={(e) => setFormData({...formData, grade_reading: e.target.value})}
                />
              </div>

              {/* Grade Math */}
              <div className="space-y-2">
                <Label htmlFor="grade_math">Math Grade Level</Label>
                <Input
                  id="grade_math"
                  type="text"
                  placeholder="e.g., Algebra II"
                  value={formData.grade_math}
                  onChange={(e) => setFormData({...formData, grade_math: e.target.value})}
                />
              </div>

              {/* Current Level */}
              <div className="space-y-2">
                <Label htmlFor="current_level">Current Level</Label>
                <Input
                  id="current_level"
                  type="text"
                  placeholder="Your current academic level"
                  value={formData.current_level}
                  onChange={(e) => setFormData({...formData, current_level: e.target.value})}
                />
              </div>

              {/* Career Interests */}
              <div className="space-y-2">
                <Label htmlFor="career_interests">Career Interests</Label>
                <Textarea
                  id="career_interests"
                  placeholder="Tell us about your career goals..."
                  value={formData.career_interests}
                  onChange={(e) => setFormData({...formData, career_interests: e.target.value})}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Goals for BMS */}
              <div className="space-y-2">
                <Label htmlFor="goals">Goals for being in BMS *</Label>
                <Textarea
                  id="goals"
                  placeholder="Tell us what you hope to achieve..."
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  className="min-h-[100px] resize-none"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="px-6" 
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}