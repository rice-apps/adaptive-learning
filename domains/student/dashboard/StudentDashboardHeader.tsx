import Image from "next/image";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

import {BellIcon, LogOutIcon, UserIcon} from "lucide-react";
import logo from "../../../assets/logo.webp";
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

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
            <DropdownMenuItem
              // onSelect={(e) => {
              //   e.preventDefault();
              //   console.log("switching to profile page");
              //   router.push("/student/profile");
              // }}
              asChild
            >
              <Link href="/student/profile">
                <UserIcon />
                Profile
              </Link>
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
