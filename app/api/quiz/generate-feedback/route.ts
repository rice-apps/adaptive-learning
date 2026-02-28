import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resultId, questionId, studentId, studentAnswer } = body;

    console.log('📝 Generating feedback for:', { resultId, questionId, studentId });

    // Import the workflow and mastra
    const { singleQuestionFeedbackWorkflow } = await import('@/mastra/workflows/single-question-feedback-workflow');
    const { mastra } = await import('@/mastra');

    // Create a minimal execution context
    const context = {
      runId: `feedback-${Date.now()}`,
      inputData: {
        resultId,
        questionId,
        studentId,
        studentAnswer,
      },
      workflowId: 'single-question-feedback-workflow',
      state: {},
      setState: () => {},
      getStepResult: () => null,
      suspend: async () => {},
      resumeData: undefined,
      runtimeContext: {},
      emitter: { emit: () => {}, on: () => {}, off: () => {}, addEventListener: () => {}, removeEventListener: () => {} },
      mastra: mastra,
    } as any;

    // Execute the workflow step
    const { generateSingleQuestionFeedback } = await import('@/mastra/workflows/single-question-feedback-workflow');
    
    const result = await generateSingleQuestionFeedback.execute(context);

    console.log('🎯 Workflow execution result:', result);

    // If feedback was generated, return it with the score
    if (result.feedbackGenerated) {
      const { data: resultWithFeedback } = await supabase
        .from('Results')
        .select('feedback, question_score')
        .eq('id', resultId)
        .single();

      console.log('✅ Returning feedback with score:', resultWithFeedback?.question_score);

      return NextResponse.json({
        success: true,
        feedback: resultWithFeedback?.feedback || null,
        questionScore: resultWithFeedback?.question_score || null,
      });
    }

    console.error('❌ Feedback generation failed:', result.error);

    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to generate feedback',
    });

  } catch (error) {
    console.error('❌ API Error generating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}