"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { UserRole } from "./types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

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
      <div className="flex flex-col gap-5 w-1/3 min-h-[300px] bg-white rounded-lg border p-8">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <div className="flex flex-col gap-3">
          <p className="text-gray-600">
            We've sent a confirmation email to:
          </p>
          <p className="font-semibold">{email}</p>
          <p className="text-gray-600">
            Click the link in the email to complete your signup and you'll be automatically redirected to the onboarding page.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setSignupComplete(false)}
          className="mt-4"
        >
          Back to Signup
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-1/3 h-1/2 bg-white rounded-lg border p-8">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <FormItem placeholder="Email" input={email} setInput={setEmail} />
      <FormPassword placeholder="Password" input={password} setInput={setPassword} />
      <FormPassword placeholder="Confirm Password" input={confirmPassword} setInput={setConfirmPassword} />
      <RoleSelect role={role} setRole={setRole} />
      <div className="flex flex-wrap items-center gap-4 md:flex-row">
        <Button
          variant="outline"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </div>
      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
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
    />
  );
};

const RoleSelect = ({ role, setRole }: { role: string; setRole: (role: string) => void }) => {
  const roles = Object.values(UserRole);
  return (
    <Select value={role} onValueChange={setRole}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
