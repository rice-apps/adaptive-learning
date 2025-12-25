import OnboardingForm from "@/domains/educator/onboarding/OnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function EducatorOnboarding() {

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }
  
  return (
    <OnboardingForm />
  );
}