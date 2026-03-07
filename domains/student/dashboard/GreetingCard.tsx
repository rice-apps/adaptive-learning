import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GreetingCardProps {
  student: string | null;
  courseProgress?: number;
}

export default function GreetingCard({ student, courseProgress = 0 }: GreetingCardProps) {
  return (
    <Card className="mb-6 sm:mb-8">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 text-center sm:text-left">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="text-lg sm:text-xl">
              {student?.charAt(0).toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hello {student || "Student"}!
          </h1>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                Course Progress
              </span>
              <span className="text-xs font-bold text-gray-900">
                {Math.round(courseProgress)}%
              </span>
            </div>
            
            {/* The Green Progress Bar */}
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-lime-500 rounded-full transition-all" 
                style={{ width: `${Math.min(100, Math.max(0, courseProgress))}%` }} 
              />
            </div>
          </div>
        </div>
        <Progress value={33} className="h-2 sm:h-3 [&>div]:bg-lime-400" />
      </CardContent>
    </Card>
  );
}