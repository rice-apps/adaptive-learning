"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellIcon, Search } from "lucide-react";
import logo from "@/assets/logo.webp";

interface NavbarProps {
  /** Optional display name used to render avatar fallback initial */
  userName?: string | null;
}

export default function Navbar({ userName }: NavbarProps) {
  return (
    <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
      <header className="relative max-w-7xl mx-auto py-4 px-8 flex items-center justify-between">
        <Image src={logo} alt="Logo" width={120} height={72} />

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
          <Input
            placeholder="      Search for lessons, assessments..."
            className="w-full bg-white rounded-full pl-8"
          />
        </div>

        <div className="flex items-center gap-4">
          <BellIcon className="text-white h-10 w-10" />
          <Avatar className="h-14 w-14">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{userName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>
    </div>
  );
}
