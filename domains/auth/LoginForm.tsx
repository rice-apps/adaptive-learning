"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {toast} from "sonner";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyFields = () => {
    if (!email) {
      toast.error("Email is required");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!verifyFields()) {
      return;
    }

    setLoading(true);
    try {
        const supabase = await createClient();
        const {data, error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message?.toLowerCase().includes("invalid login")) {
                toast.error("Invalid email or password")
            }
            if (error.message?.toLowerCase().includes("email not confirmed")) {
                toast.error("Please confirm your email before loggin in")
            }
            else {
                toast.error("Could not log in")
                console.error(error);
            }
            return;
        }
        toast.success("Welcome!");
        console.log("Login worked");
        //reroute to dashboard
    } finally {
        setLoading(false);
    }        
  };

  return (
    <div className="flex flex-col gap-5 w-1/3 h-1/2 bg-white rounded-lg border p-8">
      <h1>Log In</h1>
      <FormItem placeholder="Email" input={email} setInput={setEmail} />
      <FormPassword placeholder="Password" input={password} setInput={setPassword} />
      <div className="flex flex-wrap items-center gap-4 md:flex-row">
        <Button variant="outline" onClick={handleLogin}>
          Log In
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