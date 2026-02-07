import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { learningFeedbackWorkflow } from './workflows/feedback-workflow';
import { learningFeedbackAgent } from './agents/feedback-agent';
import { distributionWorkflow } from './workflows/distribution-workflow';
import { distributionAgent } from './agents/distribution-agent';
import { singleQuestionFeedbackWorkflow } from './workflows/single-question-feedback-workflow';
import { createQuizFromFeedbackAgent } from './agents/quiz-from-feedback-agent';

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    learningFeedbackWorkflow,
    distributionWorkflow,
    singleQuestionFeedbackWorkflow,
  },
  agents: {
    weatherAgent,
    learningFeedbackAgent,
    distributionAgent,
    createQuizFromFeedbackAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    enabled: false, 
  },
  observability: {
    default: { enabled: true }, 
  },
});