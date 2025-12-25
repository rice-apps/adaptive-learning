import {UserRole} from "@/domains/auth/types";
import {createClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  if (token_hash && type) {
    const supabase = await createClient();

    const {error} = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Get the user after verification
      const {
        data: {user},
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has completed onboarding by checking user_role table
        const {data: existingRole} = await supabase.from("user_role").select("role").eq("user_id", user.id).single();

        if (existingRole) {
          // User already onboarded, redirect to their dashboard
          const dashboardPath = existingRole.role === "student" ? "/student/dashboard" : "/educator/dashboard";
          return NextResponse.redirect(`${origin}${dashboardPath}`);
        }

        // User has NOT completed onboarding, check their role from metadata
        const role: UserRole = user.user_metadata?.role;

        if (role === "student") {
          return NextResponse.redirect(`${origin}/student/onboarding`);
        } else if (role === "instructor") {
          return NextResponse.redirect(`${origin}/educator/onboarding`);
        }
      }

      // Default redirect if no role found
      return NextResponse.redirect(`${next}`);
    }
  }

  // If error or no token, redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
