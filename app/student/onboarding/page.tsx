import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentOnboardingForm from "./StudentOnboardingForm";

export default async function StudentOnboardingPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If not authenticated, redirect to login
  if (authError || !user) {
    redirect('/auth/login');
  }
  
  // Check if user already completed onboarding
  const { data: existingRole } = await supabase
    .from('user_role')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (existingRole) {
    // User already onboarded, redirect to dashboard
    redirect(existingRole.role === 'student' ? '/student/dashboard' : '/educator/dashboard');
  }
  
  // Check role from metadata - make sure they should be here
  const role = user.user_metadata?.role;
  
  if (role !== 'student') {
    // Wrong onboarding page, redirect to correct one or home
    redirect(role === 'educator' ? '/educator/onboarding' : '/');
  }
  
  // User is authenticated, has student role, and hasn't completed onboarding
  return <StudentOnboardingForm />;
}