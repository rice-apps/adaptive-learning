"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { UserRole } from "./types";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");

  return (
    <div className="flex flex-col gap-5 w-1/3 h-1/2 bg-white rounded-lg border p-8">
      <FormItem placeholder="Email" input={email} setInput={setEmail} />
      <FormItem placeholder="Password" input={password} setInput={setPassword} />
      <FormItem placeholder="Confirm Password" input={confirmPassword} setInput={setConfirmPassword} />
      <RoleSelect role={role} setRole={setRole} />
      <div className="flex flex-wrap items-center gap-4 md:flex-row">
        <Button variant="outline">Sign Up</Button>
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

const RoleSelect = ({role, setRole}: {role: string; setRole: (role: string) => void}) => {
  const roles = Object.values(UserRole);
  return (
    <Select value={role} onValueChange={setRole}>
      <SelectTrigger>
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>{role}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};