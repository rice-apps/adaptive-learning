import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const singleQuestionFeedbackInputSchema = z.object({
  resultId: z.string(),
  questionId: z.string(),
  studentId: z.string(),
  studentAnswer: z.any(),
});

const singleQuestionFeedbackOutputSchema = z.object({
  resultId: z.string(),
  feedbackGenerated: z.boolean(),
  error: z.string().optional(),
});

const generateSingleQuestionFeedback = createStep({
  id: 'generate-single-question-feedback',
  description: 'Generates personalized feedback for a single question immediately after submission',
  inputSchema: singleQuestionFeedbackInputSchema,
  outputSchema: singleQuestionFeedbackOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { resultId, questionId, studentId, studentAnswer } = inputData;

    try {
      // Get student's learning style
      const { data: studentData, error: studentError } = await supabase
        .from('Students')
        .select('learning_style')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        return {
          resultId,
          feedbackGenerated: false,
          error: 'Student not found',
        };
      }

      const learningStyle = typeof studentData.learning_style === 'string'
        ? JSON.parse(studentData.learning_style)
        : studentData.learning_style;

      // Get the question
      const { data: question, error: questionError } = await supabase
        .from('Questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        return {
          resultId,
          feedbackGenerated: false,
          error: 'Question not found',
        };
      }

      const questionDetails = typeof question.question_details === 'string'
        ? JSON.parse(question.question_details)
        : question.question_details;

      const normalizeStudentAnswer = (a: any) => {
        if (a === null || a === undefined) return '';
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      };

      const isGedExtendedResponse = question.question_type === 'ged_extended_response';

      // For GED ER we do rubric-style feedback (not correct/incorrect).
      // For drag_drop we compare arrays against qa_pairs answers.
      const computeCorrectness = () => {
        if (isGedExtendedResponse) return null;
        if (question.question_type === 'drag_drop') {
          const correctAnswers = (questionDetails?.qa_pairs || []).map((p: any) => p.answer);
          let arr: any[] | null = null;
          if (Array.isArray(studentAnswer)) arr = studentAnswer;
          else if (typeof studentAnswer === 'string') {
            try {
              const parsed = JSON.parse(studentAnswer);
              if (Array.isArray(parsed)) arr = parsed;
            } catch {
              // ignore
            }
          }
          if (!arr || arr.length !== correctAnswers.length) return false;
          return arr.every((v, i) => v === correctAnswers[i]);
        }
        return String(studentAnswer) === String(questionDetails?.answer);
      };

      const isCorrect = computeCorrectness();

      // Get the agent
      const agent = mastra?.getAgent('learningFeedbackAgent');
      if (!agent) {
        return {
          resultId,
          feedbackGenerated: false,
          error: 'Agent not found',
        };
      }

      let prompt = `A student just answered a question. Please provide personalized feedback.

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
Question: "${isGedExtendedResponse ? (questionDetails?.prompt || 'Extended response prompt') : questionDetails.question}"

${questionDetails.options ? `Options:\n${questionDetails.options.map((opt: string, i: number) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}` : ''}

Student's Answer: ${normalizeStudentAnswer(studentAnswer)}
${isCorrect === null ? '' : `Correct Answer: ${questionDetails.answer}\nResult: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
`;

      if (isGedExtendedResponse) {
        const essay =
          typeof studentAnswer === 'string'
            ? studentAnswer
            : (studentAnswer && typeof studentAnswer === 'object')
              ? String(studentAnswer.essay || '')
              : '';

        const stimulusDocumentId = questionDetails?.stimulus_document_id;
        let stimulusBlock = '';

        if (stimulusDocumentId) {
          const { data: doc } = await supabase
            .from('question_stimulus_documents')
            .select('title,intro,time_limit_minutes')
            .eq('id', stimulusDocumentId)
            .single();

          const { data: sources } = await supabase
            .from('question_stimulus_sources')
            .select('sort_order,label,title,author,publication,genre,body_markdown')
            .eq('document_id', stimulusDocumentId)
            .order('sort_order', { ascending: true });

          const sourcesText = (sources || []).map((s: any) => {
            const header = [
              s.label || `Source ${s.sort_order}`,
              s.title,
              [s.author, s.publication, s.genre].filter(Boolean).join(' • '),
            ].filter(Boolean).join('\n');
            return `${header}\n\n${s.body_markdown}`;
          }).join('\n\n---\n\n');

          stimulusBlock = `\n\n═══════════════════════════════════════════════════════════════\nSOURCE MATERIALS\n═══════════════════════════════════════════════════════════════\nTitle: ${doc?.title || 'Stimulus'}\n${doc?.intro ? `Intro: ${doc.intro}\n` : ''}${doc?.time_limit_minutes ? `Suggested time: ${doc.time_limit_minutes} minutes\n` : ''}\n${sourcesText}\n`;
        }

        prompt += `${stimulusBlock}

You are a GED RLA writing coach. Provide feedback on the student's extended response essay.

Requirements:
- Do NOT mark correct/incorrect.
- Evaluate on: (1) claim/position & reasoning, (2) use of evidence from BOTH sources, (3) organization & coherence, (4) clarity/grammar.
- Give 1 short strengths paragraph, 1 short improvements paragraph, then 4 bullet points: Evidence, Organization, Clarity, Next step.
- Be supportive and match the student's learning preference: "${learningStyle.learnBest}".\n\nSTUDENT ESSAY:\n${essay}\n`;
      } else {
        prompt += `${isCorrect ? `
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
      }

      const response = await agent.stream([{ role: 'user', content: prompt }]);

      let feedbackText = '';
      for await (const chunk of response.textStream) {
        feedbackText += chunk;
      }

      // Update the result with feedback
      const { error: updateError } = await supabase
        .from('Results')
        .update({ feedback: feedbackText })
        .eq('id', resultId);

      if (updateError) {
        return {
          resultId,
          feedbackGenerated: false,
          error: updateError.message,
        };
      }

      return {
        resultId,
        feedbackGenerated: true,
      };
    } catch (error) {
      return {
        resultId,
        feedbackGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

const singleQuestionFeedbackWorkflow = createWorkflow({
  id: 'single-question-feedback-workflow',
  inputSchema: singleQuestionFeedbackInputSchema,
  outputSchema: singleQuestionFeedbackOutputSchema,
})
  .then(generateSingleQuestionFeedback);

singleQuestionFeedbackWorkflow.commit();

export { singleQuestionFeedbackWorkflow, generateSingleQuestionFeedback };