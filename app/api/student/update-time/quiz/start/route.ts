import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { quizId } = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set start_time when quiz begins
    const { error } = await supabase
      .from('Quizzes')
      .update({
        start_time: new Date().toISOString(),
      })
      .eq('id', quizId)
      .eq('student_id', user.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Quiz started' 
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to start quiz' },
      { status: 500 }
    );
  }
}