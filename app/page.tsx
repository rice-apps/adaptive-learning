import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If not authenticated, redirect to login
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
  
  // If no role found, user needs to complete onboarding
  // Check user_metadata to determine which onboarding page
  const roleFromMetadata = user.user_metadata?.role;
  if (roleFromMetadata === "student") {
    redirect("/student/onboarding");
  } else if (roleFromMetadata === "instructor") {
    redirect("/educator/onboarding");
  }
  
  // Fallback to login if no role information found
  redirect("/login");
}
