"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo.webp";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    try {
      const supabase = await createClient();
      // Sign in
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
      if (signInError) {
        console.error(signInError);
        toast.error(signInError.message || "Invalid email or password");
        return;
      }
      // Check if user is in Students table
      const { data: studentData } = await supabase
        .from("Students")
        .select("*")
        .eq("email", email)
        .single();
      toast.success("Login successful!");
      // Route based on whether they're in Students table
      if (studentData) {
        router.push("/student/onboarding");
      } else {
        router.push("/student/onboarding");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Column - Form */}
      <div className="flex w-full lg:w-1/2 justify-center items-center bg-white p-4 sm:p-6 md:p-8 order-2 lg:order-1">
        <div className="flex flex-col w-full max-w-sm sm:max-w-md bg-white border rounded-2xl sm:rounded-3xl overflow-hidden outline outline-1 outline-black">
          {/* Header */}
          <h1 className="text-lg sm:text-xl font-semibold bg-lime-300 py-4 sm:py-6 text-center outline outline-1 outline-black">
            Log In
          </h1>

          {/* Form */}
          <div className="flex flex-col gap-3 sm:gap-4 px-5 sm:px-8 py-6 sm:py-10">
            <Input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 sm:h-11 rounded-xl border border-black bg-gray-100 px-3 sm:px-4 text-sm sm:text-base text-black placeholder:text-black"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 sm:h-11 rounded-xl border border-black bg-gray-100 px-3 sm:px-4 text-sm sm:text-base text-black placeholder:text-black"
            />
            <Button
              variant="outline"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-300 border rounded-3xl h-10 sm:h-11 text-sm sm:text-base"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Logo */}
      <div className="flex justify-center items-center w-full lg:w-1/2 bg-black p-6 sm:p-8 lg:p-10 min-h-[200px] sm:min-h-[250px] lg:min-h-screen order-1 lg:order-2">
        <Image
          className="w-full max-w-[200px] sm:max-w-[300px] lg:max-w-[500px] h-auto"
          src={logo}
          alt="8MS logo"
          width={1200}
          height={720}
        />
      </div>
    </div>
  );
}