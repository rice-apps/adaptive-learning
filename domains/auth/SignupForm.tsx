"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useState} from "react";
import {UserRole} from "./types";
import {createClient} from "@/lib/supabase/client";
import {toast} from "sonner";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");

  const verifyFields = () => {
    if (!email) {
      toast.error("Email is required");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
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
    const supabase = await createClient();
    const {error} = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          role: role,
        },
      },
    });

    if (error) {
      console.error(error);
      toast.error("Something went wrong");
      return;
    }

    toast.success("Signup successful");
    console.log("Signup worked");
  };

  return (
    <div className="flex flex-col gap-5 w-1/3 h-1/2 bg-white rounded-lg border p-8">
      <h1>Sign Up</h1>
      <FormItem placeholder="Email" input={email} setInput={setEmail} />
      <FormPassword placeholder="Password" input={password} setInput={setPassword} />
      <FormPassword placeholder="Confirm Password" input={confirmPassword} setInput={setConfirmPassword} />
      <RoleSelect role={role} setRole={setRole} />
      <div className="flex flex-wrap items-center gap-4 md:flex-row">
        <Button variant="outline" onClick={handleSignup}>
          Sign Up
        </Button>
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
      onChange={e => setInput(e.target.value)}
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
      onChange={e => setInput(e.target.value)}
      required
    />
  );
};

const RoleSelect = ({role, setRole}: {role: string; setRole: (role: string) => void}) => {
  const roles = Object.values(UserRole);
  return (
    <Select value={role} onValueChange={setRole}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map(role => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
