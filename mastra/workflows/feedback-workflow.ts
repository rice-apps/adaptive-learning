import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

const processAllQuestionsFeedback = createStep({
  id: 'process-all-questions-feedback',
  description: 'Processes all questions in a quiz and generates personalized feedback for each',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizFeedbackOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { quizId, studentId } = inputData;

    // Get all results for this quiz and student
    const { data: results, error: resultsError } = await supabase
      .from('Results')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId);

    if (resultsError) throw new Error(`Supabase error: ${resultsError.message}`);
    if (!results || results.length === 0) throw new Error(`No results found for quiz: ${quizId}, student: ${studentId}`);

    // Get student's learning style
    const { data: studentData, error: studentError } = await supabase
      .from('Students')
      .select('learning_style')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) throw new Error(`Student not found: ${studentId}`);

    const learningStyle = typeof studentData.learning_style === 'string' 
      ? JSON.parse(studentData.learning_style) 
      : studentData.learning_style;

    // Get all questions
    const questionIds = results.map(r => r.question_id);
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
      const question = questions.find(q => q.id === result.question_id);
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

${questionDetails.options ? `Options:\n${questionDetails.options.map((opt, i) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}` : ''}

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

const learningFeedbackWorkflow = createWorkflow({
  id: 'learning-feedback-workflow',
  inputSchema: quizFeedbackInputSchema,
  outputSchema: quizFeedbackOutputSchema,
})
  .then(processAllQuestionsFeedback);

learningFeedbackWorkflow.commit();

export { learningFeedbackWorkflow };