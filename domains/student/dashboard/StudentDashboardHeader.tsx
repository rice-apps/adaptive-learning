import Image from "next/image";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Input} from "@/components/ui/input";

import {BellIcon, Search} from "lucide-react";
import logo from "../../../assets/logo.webp";

interface StudentDashboardHeaderProps {
  student: string | null;
  avatar: string | null;
}

export default function StudentDashboardHeader({student, avatar}: StudentDashboardHeaderProps) {
  return (
    <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
      <header className="w-full py-4 px-8 flex items-center justify-between">
        <Image src={logo} alt="Logo" width={120} height={72} />

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
          <Input placeholder="      Search for lessons, assessments..." className="bg-white rounded-full" />
        </div>

        <div className="flex items-center gap-4">
          <BellIcon className="text-white h-8 w-8" />
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback>{student?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
          </Avatar>
        </div>
      </header>
    </div>
  );
}
