import { Card, CardContent } from "@/components/ui/card";

interface GreetingCardProps {
  student: string | null;
  courseProgress?: number;
}

export default function GreetingCard({ student, courseProgress = 0 }: GreetingCardProps) {
  return (
    <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardContent className="p-8 flex items-center gap-8">
        {/* Avatar Section */}
        <div className="w-24 h-24 rounded-full bg-purple-100 overflow-hidden border-4 border-white shadow-sm flex-shrink-0">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student || 'Student'}`} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Text & Progress Section */}
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Hello {student || 'Student'}!
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
      </CardContent>
    </Card>
  );
}