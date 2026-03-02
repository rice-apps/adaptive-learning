import {UserRole} from "@/domains/auth/types";
import {createClient} from "@/lib/supabase/server";
import {getSiteOrigin} from "@/lib/url/getSiteOrigin";
import {NextResponse} from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = getSiteOrigin(request);

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
          return NextResponse.redirect(new URL(dashboardPath, origin));
        }

        // User has NOT completed onboarding, check their role from metadata
        const role: UserRole = user.user_metadata?.role;

        if (role === "student") {
          return NextResponse.redirect(new URL("/student/onboarding", origin));
        } else if (role === "instructor") {
          return NextResponse.redirect(new URL("/educator/onboarding", origin));
        }
      }

      // Default redirect if no role found (handles both relative and absolute next)
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If error or no token, redirect to error page
  return NextResponse.redirect(new URL("/auth/auth-error", origin));
}
