import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resultId, questionId, studentAnswer } = body;

    console.log('🎯 Scoring question:', { resultId, questionId, studentAnswer });

    // Fetch the question
    const { data: question, error: questionError } = await supabase
      .from('Questions')
      .select('question_type, question_details, subject')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.error('❌ Question not found:', questionError);
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    const questionType = question.question_type;
    const subject = question.subject;
    const questionDetails = typeof question.question_details === 'string'
      ? JSON.parse(question.question_details)
      : question.question_details;

    let score: number | null = null;

    console.log('📋 Question type:', questionType);
    console.log('📚 Subject:', subject);
    console.log('📝 Question details:', questionDetails);

    // Score MCQ questions
    if (questionType === 'mcq' || questionType === 'multiple_choice') {
      const correctAnswer = questionDetails.answer;
      const studentAnswerStr = String(studentAnswer).trim();
      const correctAnswerStr = String(correctAnswer).trim();

      console.log('🔍 MCQ - Student answer:', studentAnswerStr);
      console.log('🔍 MCQ - Correct answer:', correctAnswerStr);

      score = studentAnswerStr === correctAnswerStr ? 10 : 0;
      console.log('✅ MCQ Score:', score);
    }

    // Score drag-and-drop questions
    else if (questionType === 'drag_drop') {
      const correctAnswers = (questionDetails.qa_pairs || []).map((pair: any) => pair.answer);
      
      console.log('🔍 Drag-Drop - Correct answers:', correctAnswers);
      console.log('🔍 Drag-Drop - Student answer:', studentAnswer);

      let studentAnswersArray: string[] = [];
      if (Array.isArray(studentAnswer)) {
        studentAnswersArray = studentAnswer;
      } else if (typeof studentAnswer === 'string') {
        try {
          const parsed = JSON.parse(studentAnswer);
          if (Array.isArray(parsed)) {
            studentAnswersArray = parsed;
          }
        } catch (e) {
          console.error('Failed to parse student answer:', e);
          studentAnswersArray = [];
        }
      }

      console.log('🔍 Drag-Drop - Parsed student answers:', studentAnswersArray);

      const isCorrect = 
        studentAnswersArray.length === correctAnswers.length &&
        studentAnswersArray.every((answer, index) => 
          String(answer).trim() === String(correctAnswers[index]).trim()
        );

      score = isCorrect ? 10 : 0;
      console.log('✅ Drag-Drop Score:', score);
    }

    // Score free response for Math or Science
    else if (questionType === 'free_response' && (subject === 'Math' || subject === 'Science')) {
      console.log('📐 Scoring Math/Science free response...');
      
      const correctAnswer = questionDetails.answer;
      const studentAnswerStr = String(studentAnswer).trim();
      const correctAnswerStr = String(correctAnswer).trim();

      console.log('🔍 Free Response - Student answer:', `"${studentAnswerStr}"`);
      console.log('🔍 Free Response - Correct answer:', `"${correctAnswerStr}"`);
      console.log('🔍 Free Response - Match?', studentAnswerStr === correctAnswerStr);

      score = studentAnswerStr === correctAnswerStr ? 10 : 0;
      console.log('✅ Free Response Score:', score);
    }

    // For other question types
    else {
      console.log('ℹ️ Question type does not need automatic scoring:', questionType, subject);
      return NextResponse.json({
        success: true,
        score: null,
        message: 'Question type does not support automatic scoring'
      });
    }

    // Update the Results table with the score
    console.log('💾 Updating Results table with score:', score);
    
    const { error: updateError } = await supabase
      .from('Results')
      .update({ question_score: score })
      .eq('id', resultId);

    if (updateError) {
      console.error('❌ Failed to update score:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save score' },
        { status: 500 }
      );
    }

    console.log('✅ Score saved successfully:', score);

    return NextResponse.json({
      success: true,
      score,
      questionType,
      subject
    });

  } catch (error) {
    console.error('❌ Error scoring question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to score question' },
      { status: 500 }
    );
  }
}