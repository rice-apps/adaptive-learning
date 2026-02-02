import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BellIcon, Search } from "lucide-react";
import logo from "../../../assets/logo.webp";

interface StudentDashboardHeaderProps {
  student: string | null;
}

export default function StudentDashboardHeader({
  student,
}: StudentDashboardHeaderProps) {
  return (
    <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
      <header className="w-full py-3 sm:py-4 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Logo and User Info Row (mobile) / Logo (desktop) */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <Image
            src={logo}
            alt="Logo"
            width={120}
            height={72}
            className="w-[100px] sm:w-[120px] h-auto"
          />

          {/* Mobile: Show avatar and bell in header row */}
          <div className="flex items-center gap-3 sm:hidden">
            <BellIcon className="text-white h-6 w-6" />
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {student?.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm order-3 sm:order-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
          <Input
            placeholder="Search for lessons, assessments..."
            className="bg-white rounded-full pl-9 text-sm sm:text-base"
          />
        </div>

        {/* Desktop: Avatar and Bell */}
        <div className="hidden sm:flex items-center gap-4 order-2 sm:order-3">
          <BellIcon className="text-white h-7 w-7 md:h-8 md:w-8" />
          <Avatar className="h-10 w-10 md:h-12 md:w-12">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>
              {student?.charAt(0).toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>
    </div>
  );
}
