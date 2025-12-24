import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { seconds } = await request.json();

    if (!seconds || seconds <= 0) {
      return NextResponse.json({ error: 'Invalid time' }, { status: 400 });
    }

    // Get user from cookies
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-access-token')?.value;

    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Decode the JWT to get user ID (you may need to verify the token properly)
    // For now, we'll use a simpler approach with the regular client
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current timeSpent
    const { data: student } = await supabase
      .from('Students')
      .select('timeSpent')
      .eq('id', user.id)
      .single();

    const currentTime = student?.timeSpent || 0;
    const newTime = currentTime + seconds;

    // Update timeSpent
    const { error } = await supabase
      .from('Students')
      .update({ timeSpent: newTime })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, timeSpent: newTime });
  } catch (error) {
    console.error('Error updating time:', error);
    return NextResponse.json(
      { error: 'Failed to update time' },
      { status: 500 }
    );
  }
}