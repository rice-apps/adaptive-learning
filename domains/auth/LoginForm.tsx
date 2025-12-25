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
    <div className="flex w-full min-h-screen">
      {/* Left Column */}
      <div className="flex w-1/2 justify-center items-center bg-white">
        <div className="flex flex-col w-full max-w-md bg-white border rounded-3xl overflow-hidden outline outline-1 outline-black">
          {/* Header */}
          <h1 className="text-xl font-semibold bg-lime-300 py-6 text-center outline outline-1 outline-black">
            Log In
          </h1>

          {/* Form */}
          <div className="flex flex-col gap-4 px-8 py-10">
            <Input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl border border-black bg-gray-100 px-4 text-black placeholder:text-black"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-xl border border-black bg-gray-100 px-4 text-black placeholder:text-black"
            />

            <Button
              variant="outline"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-lime-300 border rounded-3xl"
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-2">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex justify-center items-center w-1/2 bg-black">
        <h1>
          <Image
            className="p-10 h-full w-full"
            src={logo}
            alt="8MS logo"
            width={1200}
            height={720}
          />
        </h1>
      </div>
    </div>
  );
}
