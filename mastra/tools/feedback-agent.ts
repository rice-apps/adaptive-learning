import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const singleQuestionFeedbackTool = createTool({
  id: 'single-question-feedback',
  description: 'Generates personalized feedback for a single question based on student learning style',
  inputSchema: z.object({
    learningStyle: z.object({
      learnBest: z.string().describe('How the student learns best'),
      wrongAnswerAction: z.string().describe('What student wants when they get wrong answers'),
      worriedSubject: z.string().optional().describe('Subject the student is worried about'),
      hardFactors: z.array(z.string()).optional().describe('Challenges the student faces'),
    }),
    question: z.string().describe('The question text'),
    correctAnswer: z.string().describe('The correct answer'),
    studentAnswer: z.string().describe('What the student answered'),
    subject: z.string().describe('Subject area (e.g., Math, Reading)'),
    topic: z.string().describe('Specific topic (e.g., Multiplication of decimals)'),
    options: z.array(z.string()).optional().describe('Multiple choice options if applicable'),
  }),
  outputSchema: z.object({
    isCorrect: z.boolean(),
    feedbackText: z.string(),
  }),
  execute: async ({ context }) => {
    const isCorrect = context.studentAnswer === context.correctAnswer;
    
    return {
      isCorrect,
      feedbackText: '', // Will be filled by agent
    };
  },
});