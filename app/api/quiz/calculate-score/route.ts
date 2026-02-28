import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { quizId } = await request.json();

    if (!quizId) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    console.log('📊 Calculating score for quiz:', quizId);

    // Get all results for this quiz
    const { data: results, error: resultsError } = await supabase
      .from('Results')
      .select('question_score')
      .eq('quiz_id', quizId);

    if (resultsError) {
      console.error('Error fetching results:', resultsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch results' },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      console.log('⚠️ No results found for quiz');
      return NextResponse.json(
        { success: false, error: 'No results found for this quiz' },
        { status: 404 }
      );
    }

    console.log(`📝 Found ${results.length} results`);

    // Sum up all question scores (handle null scores as 0)
    const totalScore = results.reduce((sum, result) => {
      const score = result.question_score ?? 0;
      return sum + score;
    }, 0);

    console.log(`✅ Total score: ${totalScore}`);

    // Calculate percentage: (totalScore / (10 * numberOfQuestions)) * 100
    const numberOfQuestions = results.length;
    const maxPossibleScore = 10 * numberOfQuestions;
    const percentageScore = (totalScore / maxPossibleScore) * 100;
    const finalScore = Math.round(percentageScore);

    console.log(`🎯 Final score: ${finalScore}% (${totalScore}/${maxPossibleScore})`);

    // Update the quiz with the calculated score
    const { error: updateError } = await supabase
      .from('Quizzes')
      .update({ score: finalScore })
      .eq('id', quizId);

    if (updateError) {
      console.error('Error updating quiz score:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update quiz score' },
        { status: 500 }
      );
    }

    console.log('✅ Quiz score updated successfully');

    return NextResponse.json({
      success: true,
      score: finalScore,
      totalScore,
      maxPossibleScore,
      numberOfQuestions
    });

  } catch (error) {
    console.error('❌ Error calculating quiz score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate quiz score' },
      { status: 500 }
    );
  }
}