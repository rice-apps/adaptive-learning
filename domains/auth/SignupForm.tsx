"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { UserRole } from "./types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo.webp";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  const verifyFields = () => {
    if (!email) {
      toast.error("Email is required");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (!confirmPassword) {
      toast.error("Confirm Password is required");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (!role) {
      toast.error("Role is required");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!verifyFields()) {
      return;
    }

    setLoading(true);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/confirm`,
        },
      });

      if (error) {
        console.error(error);
        toast.error(error.message || "Something went wrong");
        return;
      }

      if (data.user) {
        setSignupComplete(true);
        toast.success("Check your email to confirm your account!");
        console.log("Signup worked");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-sm sm:max-w-md min-h-[280px] sm:min-h-[300px] bg-white rounded-lg border p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold">Check your email</h1>
          <div className="flex flex-col gap-2 sm:gap-3">
            <p className="text-sm sm:text-base text-gray-600">
              We've sent a confirmation email to:
            </p>
            <p className="font-semibold text-sm sm:text-base break-all">
              {email}
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Click the link in the email to complete your signup and you'll be
              automatically redirected to the onboarding page.
            </p>
          </div>
          <Button
            onClick={handleSignup}
            disabled={loading}
            className="
              w-full 
              h-10
              sm:h-11
              rounded-full 
              bg-lime-300 
              text-black 
              font-semibold
              hover:bg-lime-400
              border-none
              text-sm
              sm:text-base
            "
          >
            {loading ? "Signing up..." : "Resend Email"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Column - Form */}
      <div className="flex w-full lg:w-1/2 justify-center items-center p-4 sm:p-6 md:p-8 lg:p-5 order-2 lg:order-1">
        <div
          className="
            flex flex-col 
            w-full 
            max-w-sm
            sm:max-w-md
            bg-white 
            border 
            rounded-2xl
            sm:rounded-3xl 
            overflow-hidden 
            outline outline-1 outline-black
          "
        >
          <h1 className="text-lg sm:text-xl font-semibold bg-lime-300 py-4 sm:py-6 text-center outline outline-1 outline-black">
            Sign Up
          </h1>

          <div className="flex flex-col gap-4 sm:gap-5 px-5 sm:px-8 py-6 sm:py-10">
            <FormItem placeholder="Email" input={email} setInput={setEmail} />
            <FormPassword
              placeholder="Password"
              input={password}
              setInput={setPassword}
            />
            <FormPassword
              placeholder="Confirm Password"
              input={confirmPassword}
              setInput={setConfirmPassword}
            />
            <RoleSelect role={role} setRole={setRole} />
            <div className="flex flex-col gap-3 sm:gap-4 justify-center h-full">
              <Button
                variant="outline"
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-lime-300 border rounded-3xl text-sm sm:text-base h-10 sm:h-11"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
              <p className="text-center text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
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

const FormItem = ({
  placeholder,
  input,
  setInput,
}: {
  placeholder: string;
  input: string;
  setInput: (input: string) => void;
}) => {
  return (
    <Input
      type="text"
      id="textBox"
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      required
      className="border border-black h-10 sm:h-11 bg-gray-100 text-black placeholder:text-black text-sm sm:text-base"
    />
  );
};

const FormPassword = ({
  placeholder,
  input,
  setInput,
}: {
  placeholder: string;
  input: string;
  setInput: (input: string) => void;
}) => {
  return (
    <Input
      type="password"
      id="textBox"
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      required
      className="border border-black h-10 sm:h-11 bg-gray-100 text-black placeholder:text-black text-sm sm:text-base"
    />
  );
};

const RoleSelect = ({
  role,
  setRole,
}: {
  role: string;
  setRole: (role: string) => void;
}) => {
  const roles = Object.values(UserRole);
  return (
    <Select value={role} onValueChange={setRole}>
      <SelectTrigger className="border border-black h-12 sm:h-14 text-sm sm:text-base">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role} className="text-sm sm:text-base">
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};