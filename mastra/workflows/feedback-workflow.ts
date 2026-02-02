import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Schemas ────────────────────────────────────────────────

const quizFeedbackInputSchema = z.object({
  quizId: z.string(),
  studentId: z.string(),
});

const quizFeedbackOutputSchema = z.object({
  quizId: z.string(),
  studentId: z.string(),
  totalQuestions: z.number(),
  processedCount: z.number(),
  errorCount: z.number(),
});

const quizSummaryOutputSchema = z.object({
  quizId: z.string(),
  studentId: z.string(),
  summary: z.string(),
});

// ─── Step 1: Per-question feedback ──────────────────────────

const processAllQuestionsFeedback = createStep({
  id: 'process-all-questions-feedback',
  description: 'Processes all questions in a quiz and generates personalized feedback for each',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizFeedbackOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { quizId, studentId } = inputData;

    const { data: results, error: resultsError } = await supabase
      .from('Results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId);

    if (resultsError) throw new Error(`Supabase error: ${resultsError.message}`);
    if (!results || results.length === 0) throw new Error(`No results found for quiz: ${quizId}, student: ${studentId}`);

    const { data: studentData, error: studentError } = await supabase
      .from('Students')
      .select('learning_style')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) throw new Error(`Student not found: ${studentId}`);

    const learningStyle = typeof studentData.learning_style === 'string'
      ? JSON.parse(studentData.learning_style)
      : studentData.learning_style;

    const questionIds = results.map((r: any) => r.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('Questions')
      .select('*')
      .in('id', questionIds);

    if (questionsError || !questions) throw new Error('Questions not found');

    const agent = mastra?.getAgent('learningFeedbackAgent');
    if (!agent) throw new Error('Learning feedback agent not found');

    let processedCount = 0;
    let errorCount = 0;

    for (const result of results) {
      const question = questions.find((q: any) => q.id === result.question_id);
      if (!question) {
        errorCount++;
        continue;
      }

      const questionDetails = typeof question.question_details === 'string'
        ? JSON.parse(question.question_details)
        : question.question_details;

      const isCorrect = result.student_answer === questionDetails.answer;

      try {
        const prompt = `A student just answered a question. Please provide personalized feedback.

═══════════════════════════════════════════════════════════════
STUDENT LEARNING PROFILE
═══════════════════════════════════════════════════════════════
- Learns best by: ${learningStyle.learnBest}
- When wrong, prefers: ${learningStyle.wrongAnswerAction}
${learningStyle.worriedSubject ? `• Worried about: ${learningStyle.worriedSubject}` : ''}
${learningStyle.hardFactors ? `• Challenges: ${learningStyle.hardFactors.join(', ')}` : ''}

═══════════════════════════════════════════════════════════════
QUESTION DETAILS
═══════════════════════════════════════════════════════════════
Subject: ${question.subject}
Topic: ${question.topic}
Question: "${questionDetails.question}"

${questionDetails.options ? `Options:\n${questionDetails.options.map((opt: string, i: number) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}` : ''}

Student's Answer: ${result.student_answer}
Correct Answer: ${questionDetails.answer}
Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════

${isCorrect ? `
Provide 2-3 paragraphs that:
1. Celebrates their success
2. Explains why their answer is correct
3. Reinforces the concept
4. Encourages continued practice
` : `
Provide 3-5 paragraphs that:
1. Acknowledges the attempt without discouragement
2. Explains what went wrong
3. Teaches the correct approach step-by-step
4. ${learningStyle.wrongAnswerAction === 'Show me an example' ? 'MUST provide a worked example' : 'Provides a clear explanation'}
5. ${learningStyle.worriedSubject === question.subject ? `Addresses their worry about ${question.subject} with extra encouragement` : 'Is supportive'}

${learningStyle.wrongAnswerAction === 'Show me an example' ? 'CRITICAL: Include a similar worked example with step-by-step solution.' : ''}
`}

Use the "${learningStyle.learnBest}" learning approach in your explanation.`;

        const response = await agent.stream([{ role: 'user', content: prompt }]);

        let feedbackText = '';
        for await (const chunk of response.textStream) {
          feedbackText += chunk;
        }

        const { error: updateError } = await supabase
          .from('Results')
          .update({ feedback: feedbackText })
          .eq('id', result.id);

        if (updateError) {
          errorCount++;
        } else {
          processedCount++;
        }

      } catch (error) {
        errorCount++;
      }
    }

    return {
      quizId,
      studentId,
      totalQuestions: results.length,
      processedCount,
      errorCount,
    };
  },
});

// ─── Step 2: Quiz-level summary ─────────────────────────────

const generateQuizSummary = createStep({
  id: 'generate-quiz-summary',
  description: 'Reads all per-question feedback for the quiz, summarizes into 3-4 sentences highlighting stronger/weaker topics, writes to quiz_feedback on all rows for that quiz_id',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizSummaryOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { quizId, studentId } = inputData;

    // Fetch all results for this quiz — per-question feedback is already written
    const { data: results, error: resultsError } = await supabase
      .from('Results')
      .select('question_id, feedback')
      .eq('quiz_id', quizId);

    if (resultsError) throw new Error(`Supabase error: ${resultsError.message}`);
    if (!results || results.length === 0) throw new Error(`No results found for quiz: ${quizId}`);

    // Get questions so we have subject + topic context
    const questionIds = results.map((r: any) => r.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('Questions')
      .select('id, subject, topic')
      .in('id', questionIds);

    if (questionsError || !questions) throw new Error('Questions not found');

    // Build one block per question: subject, topic, and its feedback
    const feedbackBlocks = results.map((result: any, i: number) => {
      const question = questions.find((q: any) => q.id === result.question_id);
      if (!question || !result.feedback) return null;

      return `Question ${i + 1}
Subject: ${question.subject}
Topic: ${question.topic}
Feedback: ${result.feedback}`;
    }).filter(Boolean).join('\n\n');

    const agent = mastra?.getAgent('learningFeedbackAgent');
    if (!agent) throw new Error('Learning feedback agent not found');

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

    // Write the summary to quiz_feedback on every row with this quiz_id
    const { error: updateError } = await supabase
      .from('Results')
      .update({ quiz_feedback: summaryText })
      .eq('quiz_id', quizId);

    if (updateError) throw new Error(`Failed to write quiz_feedback: ${updateError.message}`);

    return {
      quizId,
      studentId,
      summary: summaryText,
    };
  },
});

// ─── Workflows ──────────────────────────────────────────────

// Full workflow: per-question feedback + summary in one go
const learningFeedbackWorkflow = createWorkflow({
  id: 'learning-feedback-workflow',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizSummaryOutputSchema,
})
  .then(processAllQuestionsFeedback)
  .then(generateQuizSummary);

learningFeedbackWorkflow.commit();

// Summary-only workflow: per-question feedback is already written during the quiz
// via /api/quiz/generate-feedback, so on finish we only need the summary step
const quizSummaryWorkflow = createWorkflow({
  id: 'quiz-summary-workflow',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizSummaryOutputSchema,
})
  .then(generateQuizSummary);

quizSummaryWorkflow.commit();

export { learningFeedbackWorkflow, quizSummaryWorkflow };