import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GreetingCardProps {
  student: string | null;
}

export default function GreetingCard({ student }: GreetingCardProps) {
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
        </div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-base sm:text-lg">COURSE PROGRESS</h2>
          <Badge className="bg-white text-black text-xs sm:text-sm">33%</Badge>
        </div>
        <Progress value={33} className="h-2 sm:h-3 [&>div]:bg-lime-400" />
      </CardContent>
    </Card>
  );
}