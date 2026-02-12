import Image from "next/image";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

import {BellIcon} from "lucide-react";
import logo from "../../../assets/logo.webp";

interface StudentDashboardHeaderProps {
  student: string | null;
}

export default function StudentDashboardHeader({student}: StudentDashboardHeaderProps) {
  return (
    <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
      <header className="w-full py-4 px-8 flex items-center justify-between">
        <Image src={logo} alt="Logo" width={120} height={72} />

        <div className="flex items-center gap-4">
          <BellIcon className="text-white h-8 w-8" />
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{student?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
          </Avatar>
        </div>
      </header>
    </div>
  );
}
