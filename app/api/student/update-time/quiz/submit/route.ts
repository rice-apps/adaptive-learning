import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffInMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export async function POST(request: Request) {
  try {
    const { quizId, answers } = await request.json();
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the quiz to retrieve start_time
    const { data: quiz, error: fetchError } = await supabase
      .from('Quizzes')
      .select('start_time')
      .eq('id', quizId)
      .eq('student_id', user.id)
      .single();

    if (fetchError || !quiz?.start_time) {
      return NextResponse.json(
        { error: 'Quiz not found or not started' },
        { status: 400 }
      );
    }

    const endTime = new Date().toISOString();
    const timeSpent = calculateDuration(quiz.start_time, endTime);

    // Update quiz with completion data
    const { error } = await supabase
      .from('Quizzes')
      .update({
        end_time: endTime,
        time_spent: timeSpent,
        submitted: endTime, // Store when it was submitted
      })
      .eq('id', quizId)
      .eq('student_id', user.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Quiz submitted successfully',
      timeSpent 
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}