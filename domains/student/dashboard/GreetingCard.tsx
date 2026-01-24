import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";

interface GreetingCardProps {
  student: string | null;
  avatar: string | null;
}

export default function GreetingCard({student, avatar}: GreetingCardProps) {
  return (
    <Card className="mb-8">
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{student?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold">Hello {student || "Student"}!</h1>
        </div>

        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">COURSE PROGRESS</h2>
          <Badge className="bg-white text-black">33%</Badge>
        </div>

        <Progress value={33} className="[&>div]:bg-lime-400" />
      </CardContent>
    </Card>
  );
}
