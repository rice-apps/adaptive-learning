import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user already has a role in public.user_role
      const { data: existingRole } = await supabase
        .from('user_role')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (existingRole) {
        // User already onboarded, go to dashboard
        const redirectPath = existingRole.role === 'student' 
          ? '/student/dashboard' 
          : '/educator/dashboard'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      
      // Check role from metadata and route to onboarding
      const role = user.user_metadata?.role
      
      if (role === 'student') {
        return NextResponse.redirect(new URL('/student/onboarding', request.url))
      } else if (role === 'educator') {
        return NextResponse.redirect(new URL('/educator/onboarding', request.url))
      }
    }
  }

  // If no code or error, redirect to home
  return NextResponse.redirect(new URL('/', request.url))
}