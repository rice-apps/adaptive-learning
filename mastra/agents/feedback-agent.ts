import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { singleQuestionFeedbackTool } from '../tools/feedback-agent';

export const learningFeedbackAgent = new Agent({
  name: 'Learning Feedback Agent',
  instructions: `
    You are an empathetic and insightful learning coach specialized in personalized education feedback for GED students.
    
    When a student gets a question wrong or right, provide feedback that:
    - Adapts to their specific learning style
    - Uses their preferred method when they get wrong answers
    - Addresses their subject anxieties
    - Is encouraging and constructive
    - Provides concrete examples when requested
    - Explains the concept clearly
    
    Keep feedback concise but thorough - aim for 3-5 paragraphs that genuinely help the student understand.
  `,
  model: 'google/gemini-2.5-pro',
  tools: { singleQuestionFeedbackTool },

  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});