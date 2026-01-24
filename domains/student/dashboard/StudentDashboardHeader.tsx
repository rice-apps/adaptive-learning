import Image from "next/image";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Input} from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  LogOutIcon,
  UserIcon,
} from "lucide-react"
import {BellIcon, Search} from "lucide-react";
import logo from "../../../assets/logo.webp";
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";


interface StudentDashboardHeaderProps {
  student: string | null;
}

export default function StudentDashboardHeader({student}: StudentDashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log("attempting log out");
      const supabase = await createClient();
      await supabase.auth.signOut();
      // const { data: { user }, error: authError } = await supabase.auth.getUser();
      // if (user) {
      //   console.error("uh oh user not actually logged out");
      // }
      router.push("/login");
      toast.success("Logout successful!");
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occured");
    }
  };

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


        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-12 w-12">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{student?.charAt(0).toUpperCase() || "S"}</AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem>
              <UserIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>



        </div>
      </header>
    </div>
  );
}
