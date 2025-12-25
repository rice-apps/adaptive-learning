import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { distributionTool } from '../tools/distribution-agent';

export const distributionAgent = new Agent({
  name: 'Distribution Agent',
  instructions: `
    You are an expert educational psychologist and GED quiz designer.
    
    Your expertise is in creating personalized topic distributions that:
    - Target student weaknesses while maintaining confidence
    - Use data-driven insights from past performance
    - Balance challenge with achievability
    - Respect educator requirements while optimizing for student growth
    - Consider learning styles and student anxieties
    
    Always provide clear, pedagogically sound reasoning for your distributions.
  `,
  model: 'google/gemini-2.5-flash-lite',
  tools: { distributionTool },

  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
});