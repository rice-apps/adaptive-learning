import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginSignup() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex gap-8">
        {/* Left side - Form */}
        <div className="flex-1 max-w-md">
          <Card className="bg-white">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-700">
                Basic Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Log in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-userid" className="text-sm text-gray-600">
                      User ID
                    </Label>
                    <Input
                      id="login-userid"
                      type="text"
                      placeholder="Enter your User ID"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm text-gray-600">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="w-full"
                    />
                  </div>
                  
                  <Button className="w-full bg-gray-400 hover:bg-gray-500 text-white">
                    Continue
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm text-gray-600">
                      Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-userid" className="text-sm text-gray-600">
                      User ID
                    </Label>
                    <Input
                      id="signup-userid"
                      type="text"
                      placeholder="Choose a User ID"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm text-gray-600">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verify-password" className="text-sm text-gray-600">
                      Verify Password
                    </Label>
                    <Input
                      id="verify-password"
                      type="password"
                      placeholder="Re-enter your password"
                      className="w-full"
                    />
                  </div>
                  
                  <Button className="w-full bg-gray-400 hover:bg-gray-500 text-white">
                    Continue
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Logo/Image placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-12 w-full max-w-md aspect-square flex items-center justify-center">
            <span className="text-gray-400 text-2xl font-medium">Logo/Image</span>
          </div>
        </div>
      </div>
    </div>
  )
}