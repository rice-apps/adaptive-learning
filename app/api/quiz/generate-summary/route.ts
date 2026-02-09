import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mastra } from '@/mastra';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { quizId } = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // 1. Grab all results for this quiz (feedback is already written per-question)
    const { data: results, error: resultsError } = await supabase
      .from('Results')
      .select('question_id, feedback')
      .eq('quiz_id', quizId);

    if (resultsError || !results || results.length === 0) {
      return NextResponse.json({ error: 'No results found for this quiz' }, { status: 404 });
    }

    // 2. Get the questions so we have subject + topic for each
    const questionIds = results.map((r) => r.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('Questions')
      .select('id, subject, topic')
      .in('id', questionIds);

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // 3. Build the feedback blocks for the prompt
    const feedbackBlocks = results
      .map((result, i) => {
        const question = questions.find((q) => q.id === result.question_id);
        if (!question || !result.feedback) return null;
        return `Question ${i + 1}\nSubject: ${question.subject}\nTopic: ${question.topic}\nFeedback: ${result.feedback}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // 4. Send to the agent
    const agent = mastra.getAgent('learningFeedbackAgent');

    const prompt = `Below is the individual feedback for every question a student answered on a quiz. Each entry includes the subject, topic, and the feedback that was already given for that question.

═══════════════════════════════════════════════════════════════
PER-QUESTION FEEDBACK
═══════════════════════════════════════════════════════════════
${feedbackBlocks}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
Based on all of the above, write a 3-4 sentence summary of the student's overall quiz performance. Your summary must:
1. Highlight which specific subjects and topics they are strongest in.
2. Highlight which specific subjects and topics they are weakest in.
3. Be encouraging and constructive in tone.

Be specific — name the actual subjects and topics. Keep it to exactly 3-4 sentences, no more.`;

    const response = await agent.stream([{ role: 'user', content: prompt }]);

    let summaryText = '';
    for await (const chunk of response.textStream) {
      summaryText += chunk;
    }

    // 5. Write the summary to quiz_feedback on every row with this quiz_id
    const { error: updateError } = await supabase
      .from('Quizzes')
      .update({ quiz_feedback: summaryText })
      .eq('id', quizId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save quiz summary' }, { status: 500 });
    }

    return NextResponse.json({ success: true, summary: summaryText });
  } catch (error) {
    console.error('Error generating quiz summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz summary' },
      { status: 500 }
    );
  }
}