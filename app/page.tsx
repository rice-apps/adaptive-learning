import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Middleware handles authentication, so user should exist
  if (!user) {
    redirect("/login");
  }
  
  // Get user role from user_role table
  const { data: userRole } = await supabase
    .from("user_role")
    .select("role")
    .eq("user_id", user.id)
    .single();
  
  // Redirect based on role
  if (userRole?.role === "student") {
    redirect("/student/dashboard");
  } else if (userRole?.role === "instructor") {
    redirect("/educator/dashboard");
  }
  
  // Fallback - should not reach here as middleware handles onboarding
  redirect("/login");
}
