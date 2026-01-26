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

    // If feedback was generated, return it
    if (result.feedbackGenerated) {
      const { data: resultWithFeedback } = await supabase
        .from('Results')
        .select('feedback')
        .eq('id', resultId)
        .single();

      return NextResponse.json({
        success: true,
        feedback: resultWithFeedback?.feedback || null,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Failed to generate feedback',
    });

  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}