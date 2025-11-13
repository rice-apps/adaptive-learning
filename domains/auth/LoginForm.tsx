"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
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
    <div className="flex flex-col gap-5 w-1/3 h-1/2 bg-white rounded-lg border p-8">
      <h1 className="text-2xl font-bold">Log In</h1>
      <Input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <div className="flex flex-wrap items-center gap-4 md:flex-row">
        <Button variant="outline" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </div>
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}