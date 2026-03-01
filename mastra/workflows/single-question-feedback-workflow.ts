import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Schemas ────────────────────────────────────────────────

const singleQuestionFeedbackInputSchema = z.object({
  resultId: z.string(),
  questionId: z.string(),
  studentId: z.string(),
  studentAnswer: z.string(),
});

const singleQuestionFeedbackOutputSchema = z.object({
  resultId: z.string(),
  feedbackGenerated: z.boolean(),
  questionScore: z.number().nullable(),
  error: z.string().optional(),
});

// ─── Step: Generate Single Question Feedback with Scoring ──────────────────────────

export const generateSingleQuestionFeedback = createStep({
  id: 'generate-single-question-feedback',
  description: 'Generates personalized feedback for a single question as the student answers it, and assigns a score for free response questions',
  inputSchema: singleQuestionFeedbackInputSchema,
  outputSchema: singleQuestionFeedbackOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { resultId, questionId, studentId, studentAnswer } = inputData;

    try {
      // Fetch the result
      const { data: result, error: resultError } = await supabase
        .from('Results')
        .select('*')
        .eq('id', resultId)
        .single();

      if (resultError || !result) {
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Result not found',
        };
      }

      // Fetch student learning style
      const { data: studentData, error: studentError } = await supabase
        .from('Students')
        .select('learning_style')
        .eq('id', studentId)
        .single();

      if (studentError || !studentData) {
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Student not found',
        };
      }

      const learningStyle = typeof studentData.learning_style === 'string'
        ? JSON.parse(studentData.learning_style)
        : studentData.learning_style;

      // Fetch question
      const { data: question, error: questionError } = await supabase
        .from('Questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Question not found',
        };
      }

      const questionDetails = typeof question.question_details === 'string'
        ? JSON.parse(question.question_details)
        : question.question_details;

      const isGedExtendedResponse = question.question_type === 'ged_extended_response' || question.question_type === 'free_response';
      
      // Check if subject is RLA or Social Studies
      const isRLAOrSocialStudies = question.subject === 'RLA' || question.subject === 'Social Studies';

      console.log('Question subject:', question.subject);
      console.log('Will use AI?', isRLAOrSocialStudies && isGedExtendedResponse);

      // Compute correctness for non-free-response questions
      const computeCorrectness = () => {
        if (isGedExtendedResponse) return null;
        if (question.question_type === 'drag_drop') {
          const correctAnswers = (questionDetails?.qa_pairs || []).map((p: any) => p.answer);
          let arr: any[] | null = null;
          if (Array.isArray(result.student_answer_json)) arr = result.student_answer_json;
          if (!arr && typeof result.student_answer === 'string') {
            try {
              const parsed = JSON.parse(result.student_answer);
              if (Array.isArray(parsed)) arr = parsed;
            } catch {
              // ignore
            }
          }
          if (!arr || arr.length !== correctAnswers.length) return false;
          return arr.every((v, i) => v === correctAnswers[i]);
        }
        return String(result.student_answer) === String(questionDetails?.answer);
      };

      const isCorrect = computeCorrectness();

      const agent = mastra?.getAgent('learningFeedbackAgent');
      if (!agent) {
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Learning feedback agent not found',
        };
      }

      let questionScore: number | null = null;
      let feedbackText = '';

      // Only use AI for free response questions in RLA or Social Studies
      if (isGedExtendedResponse && isRLAOrSocialStudies) {
        const essay = String(studentAnswer || '');
        const stimulusDocumentId = questionDetails?.stimulus_document_id;
        let stimulusBlock = '';
        let sourcesContext = '';

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

          sourcesContext = sourcesText;
          stimulusBlock = `\n\n═══════════════════════════════════════════════════════════════\nSOURCE MATERIALS\n═══════════════════════════════════════════════════════════════\nTitle: ${doc?.title || 'Stimulus'}\n${doc?.intro ? `Intro: ${doc.intro}\n` : ''}${doc?.time_limit_minutes ? `Suggested time: ${doc.time_limit_minutes} minutes\n` : ''}\n${sourcesText}\n`;
        }

        // FIRST AI CALL - GET SCORE WITH DETAILED RUBRIC
        const scorePrompt = `You are a strict but fair GED ${question.subject} grader. Grade this extended response essay from 0-10 using the rubric below.

PROMPT: ${questionDetails?.prompt || 'Extended response prompt'}
${stimulusBlock}

STUDENT ESSAY:
${essay}

═══════════════════════════════════════════════════════════════
COMPREHENSIVE GRADING RUBRIC (0-10 SCALE)
═══════════════════════════════════════════════════════════════

SCORE 0-1: COMPLETELY OFF-TOPIC OR INSUFFICIENT
- Essay is completely unrelated to the prompt
- No attempt to address the question
- Only 1-2 sentences or incoherent rambling
- No evidence of understanding the sources
- Copy-pasted source text without analysis

SCORE 2-3: MINIMAL EFFORT / SEVERELY DEFICIENT
- Barely addresses the prompt
- No clear position or claim
- No evidence from sources OR only mentions one source superficially
- Severely disorganized (no structure)
- Multiple major grammar/spelling errors making it hard to understand
- Less than 100 words or mostly filler content

SCORE 4-5: NEEDS SIGNIFICANT WORK
- Attempts to address prompt but misses key aspects
- Weak or unclear claim/position
- Uses only one source OR uses sources superficially (just names them)
- Poor organization (ideas scattered, no flow)
- Frequent grammar/spelling errors
- 100-150 words, lacks development

SCORE 6: ACCEPTABLE / BASIC COMPETENCY
- Addresses the prompt adequately
- Has a clear claim but reasoning is basic
- Uses BOTH sources but only with surface-level connections
- Basic organization (has intro, body, conclusion but rough transitions)
- Some grammar/spelling errors but understandable
- 150-200 words with some development

SCORE 7: GOOD / SOLID RESPONSE
- Clearly addresses all parts of the prompt
- Clear claim with reasonable supporting reasoning
- Uses BOTH sources with specific examples or quotes
- Well-organized with clear paragraphs and logical flow
- Minor grammar/spelling errors
- 200-250 words, well-developed ideas

SCORE 8: VERY GOOD / STRONG RESPONSE
- Thoroughly addresses prompt with depth
- Strong, clear claim with well-developed reasoning
- Effectively integrates evidence from BOTH sources with analysis
- Excellent organization with smooth transitions
- Very few grammar/spelling errors
- 250-300 words, sophisticated ideas

SCORE 9-10: EXCELLENT / EXCEPTIONAL
- Insightful, nuanced response to prompt
- Compelling claim with sophisticated reasoning
- Masterfully integrates and analyzes evidence from BOTH sources
- Exceptional organization and coherence
- Virtually no errors, college-level writing
- 300+ words, demonstrates critical thinking and depth

═══════════════════════════════════════════════════════════════
KEY EVALUATION CRITERIA
═══════════════════════════════════════════════════════════════
1. RELEVANCE: Does it actually answer the prompt? (Critical - if no, score ≤3)
2. CLAIM: Is there a clear position/argument?
3. EVIDENCE: Are BOTH sources used? Are they integrated well or just mentioned?
4. ORGANIZATION: Does it have structure and flow?
5. LENGTH & DEVELOPMENT: Is it substantive or thin?
6. CLARITY: Can you understand it despite any errors?

RESPOND WITH ONLY A SINGLE NUMBER FROM 0 TO 10. NOTHING ELSE.`;

        console.log(' Requesting score from AI with detailed rubric...');
        const scoreResponse = await agent.stream([{ role: 'user', content: scorePrompt }]);
        
        let scoreText = '';
        for await (const chunk of scoreResponse.textStream) {
          scoreText += chunk;
        }
        
        console.log('AI score response:', scoreText);
        
        // Extract number from response
        const numberMatch = scoreText.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
          questionScore = Math.min(10, Math.max(0, parseFloat(numberMatch[1])));
          console.log('Extracted score:', questionScore);
        } else {
          // Enhanced fallback scoring
          console.log('AI did not return a number, using fallback scoring');
          const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;
          const sentenceCount = essay.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
          
          // Check relevance to prompt
          const promptKeywords = (questionDetails?.prompt || '').toLowerCase().split(/\s+/);
          const essayLower = essay.toLowerCase();
          const relevanceScore = promptKeywords.filter((word: string) =>
            word.length > 4 && essayLower.includes(word)
          ).length;
          
          // Check if sources are mentioned
          const mentionsBothSources = sourcesContext ? 
            (essay.match(/source/gi) || []).length >= 2 : true;
          
          // Base score on length
          if (wordCount < 50) {
            questionScore = 1;
          } else if (wordCount < 100) {
            questionScore = 3;
          } else if (wordCount < 150) {
            questionScore = 4;
          } else if (wordCount < 200) {
            questionScore = 5;
          } else if (wordCount < 250) {
            questionScore = 6;
          } else if (wordCount < 300) {
            questionScore = 7;
          } else {
            questionScore = 8;
          }
          
          // Adjust based on other factors
          if (relevanceScore < 2 && questionScore) {
            questionScore = Math.max(1, questionScore - 2);
          }
          if (!mentionsBothSources && questionScore && questionScore > 5) {
            questionScore = Math.max(4, questionScore - 2);
          }
          if (sentenceCount < 5 && questionScore) {
            questionScore = Math.max(2, questionScore - 1);
          }
          
          console.log(`📏 Fallback score: ${questionScore} (${wordCount} words, ${sentenceCount} sentences, relevance: ${relevanceScore}, both sources: ${mentionsBothSources})`);
        }

        // SECOND AI CALL - GET FEEDBACK
        const feedbackPrompt = `You are a GED ${question.subject} writing coach. The student scored ${questionScore}/10 on their essay. Provide constructive, personalized feedback.

STUDENT LEARNING PROFILE:
- Learns best by: ${learningStyle.learnBest}
- When wrong, prefers: ${learningStyle.wrongAnswerAction}
${learningStyle.worriedSubject ? `- Worried about: ${learningStyle.worriedSubject}` : ''}
${learningStyle.hardFactors ? `- Challenges: ${learningStyle.hardFactors.join(', ')}` : ''}

QUESTION CONTEXT:
Subject: ${question.subject}
Topic: ${question.topic}
Prompt: ${questionDetails?.prompt || 'Extended response prompt'}
${stimulusBlock}

STUDENT ESSAY:
${essay}

THEIR SCORE: ${questionScore}/10

Provide feedback with:
1. One paragraph on what they did well (be specific - mention actual content from their essay)
2. One paragraph on what needs improvement (be constructive and actionable)
3. Four bullet points:
   • Evidence Use: How well they used the sources (or what sources they missed)
   • Organization: Structure and flow assessment
   • Clarity: Grammar, readability, and coherence
   • Next Step: One specific action to improve their next essay

Use the "${learningStyle.learnBest}" learning approach. Be encouraging but honest.`;

        console.log('Requesting feedback from AI...');
        const feedbackResponse = await agent.stream([{ role: 'user', content: feedbackPrompt }]);
        
        for await (const chunk of feedbackResponse.textStream) {
          feedbackText += chunk;
        }
        
        console.log('Feedback generated, length:', feedbackText.length);

      } else if (isGedExtendedResponse && !isRLAOrSocialStudies) {
        // Free response for Math/Science - simple length-based scoring
        console.log('Math/Science free response - using simple scoring');
        const essay = String(studentAnswer || '');
        const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;
        
        // Simple scoring based on length and effort
        if (wordCount < 20) {
          questionScore = 3;
        } else if (wordCount < 50) {
          questionScore = 5;
        } else if (wordCount < 100) {
          questionScore = 7;
        } else {
          questionScore = 9;
        }
        
        console.log(`Simple score: ${questionScore}/10 (${wordCount} words)`);
        
        feedbackText = `Good effort on your response! For ${question.subject} questions, focus on clearly explaining your reasoning and showing your work step-by-step.`;

      } else {
        // Non-free-response question - regular feedback
        const prompt = `A student just answered a question. Please provide personalized feedback.

STUDENT LEARNING PROFILE:
- Learns best by: ${learningStyle.learnBest}
- When wrong, prefers: ${learningStyle.wrongAnswerAction}
${learningStyle.worriedSubject ? `• Worried about: ${learningStyle.worriedSubject}` : ''}
${learningStyle.hardFactors ? `• Challenges: ${learningStyle.hardFactors.join(', ')}` : ''}

QUESTION DETAILS:
Subject: ${question.subject}
Topic: ${question.topic}
Question: "${questionDetails.question}"

${questionDetails.options ? `Options:\n${questionDetails.options.map((opt: string, i: number) => `  ${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}` : ''}

Student's Answer: ${studentAnswer}
Correct Answer: ${questionDetails.answer}
Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

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
`}

Use the "${learningStyle.learnBest}" learning approach.`;

        const response = await agent.stream([{ role: 'user', content: prompt }]);
        
        for await (const chunk of response.textStream) {
          feedbackText += chunk;
        }
      }

      // Update result with feedback and score
      const updateData: any = { feedback: feedbackText };
      if (questionScore !== null) {
        updateData.question_score = questionScore;
      }

      console.log('Saving to database:', {
        resultId,
        hasScore: questionScore !== null,
        score: questionScore,
        feedbackLength: feedbackText.length
      });

      const { error: updateError } = await supabase
        .from('Results')
        .update(updateData)
        .eq('id', resultId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Failed to save feedback',
        };
      }

      console.log('Successfully saved feedback and score to database');

      return {
        resultId,
        feedbackGenerated: true,
        questionScore,
      };

    } catch (error) {
      console.error('Error generating feedback:', error);
      return {
        resultId,
        feedbackGenerated: false,
        questionScore: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// ─── Workflow ──────────────────────────────────────────────

export const singleQuestionFeedbackWorkflow = createWorkflow({
  id: 'single-question-feedback-workflow',
  inputSchema: singleQuestionFeedbackInputSchema,
  outputSchema: singleQuestionFeedbackOutputSchema,
})
  .then(generateSingleQuestionFeedback);

singleQuestionFeedbackWorkflow.commit();