import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const unprotectedRoutes = ["/login", "/signup"];
  const onboardingRoutes = ["/student/onboarding", "/educator/onboarding"];

  // Check if user is authenticated
  if (
    !unprotectedRoutes.includes(request.nextUrl.pathname) &&
    !user &&
    !request.nextUrl.pathname.startsWith("/api") 
  ) {
    // no user, potentially respond by redirecting the user to the signup page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated, check for onboarding status
  const isNotProtectedOrOnboardedRoute = 
    !unprotectedRoutes.includes(request.nextUrl.pathname) && 
    !onboardingRoutes.includes(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith("/api");

  if (user && isNotProtectedOrOnboardedRoute) {
    // Get user role from user_role table using user ID from claims
    const { data: userRole, error } = await supabase
      .from("user_role")
      .select("role")
      .eq("user_id", user.sub)
      .maybeSingle();
    
    // If no role found (userRole is null), user hasn't completed onboarding
    // maybeSingle() returns null for no rows instead of throwing an error
    if (!userRole && !error) {
      // Get role from user metadata to determine which onboarding page
      const roleFromMetadata = user.user_metadata?.role;
      
      if (roleFromMetadata === "student") {
        const url = request.nextUrl.clone();
        url.pathname = "/student/onboarding";
        return NextResponse.redirect(url);
      } else if (roleFromMetadata === "instructor") {
        const url = request.nextUrl.clone();
        url.pathname = "/educator/onboarding";
        return NextResponse.redirect(url);
      }
    }
    // If there's an error, continue without redirecting to avoid blocking
    // legitimate requests due to temporary database issues
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
