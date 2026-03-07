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

      // Check if it's a free response question
      const isFreeResponse = question.question_type === 'free_response';
      const isGedExtendedResponse = question.question_type === 'ged_extended_response';
      
      // Check if subject is RLA or Social Studies
      const isRLAOrSocialStudies = question.subject === 'RLA' || question.subject === 'Social Studies';
      const isMathOrScience = question.subject === 'Math' || question.subject === 'Science';

      console.log('📚 Question subject:', question.subject);
      console.log('📝 Question type:', question.question_type);
      console.log('🤖 Will use AI?', (isGedExtendedResponse || isFreeResponse) && isRLAOrSocialStudies);

      // Compute correctness for non-free-response questions
      const computeCorrectness = () => {
        if (isFreeResponse || isGedExtendedResponse) return null;
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

      // Only use AI for GED extended response OR free response in RLA/Social Studies
      if ((isGedExtendedResponse || isFreeResponse) && isRLAOrSocialStudies) {
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

PROMPT: ${questionDetails?.prompt || questionDetails?.question || 'Extended response prompt'}
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

        console.log('🎯 Requesting score from AI with detailed rubric...');
        const scoreResponse = await agent.stream([{ role: 'user', content: scorePrompt }]);
        
        let scoreText = '';
        for await (const chunk of scoreResponse.textStream) {
          scoreText += chunk;
        }
        
        console.log('📊 AI score response:', scoreText);
        
        // Extract number from response
        const numberMatch = scoreText.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
          questionScore = Math.min(10, Math.max(0, parseFloat(numberMatch[1])));
          console.log('✅ Extracted score:', questionScore);
        } else {
          // Enhanced fallback scoring
          console.log('⚠️ AI did not return a number, using fallback scoring');
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

        // SECOND AI CALL - GET DETAILED FEEDBACK WITH HOW TO IMPROVE
        const feedbackPrompt = `You are a supportive GED ${question.subject} writing coach. The student scored ${questionScore}/10 on their essay. Provide detailed, actionable feedback.

STUDENT LEARNING PROFILE:
- Learns best by: ${learningStyle.learnBest}
- When wrong, prefers: ${learningStyle.wrongAnswerAction}
${learningStyle.worriedSubject ? `- Worried about: ${learningStyle.worriedSubject}` : ''}
${learningStyle.hardFactors ? `- Challenges: ${learningStyle.hardFactors.join(', ')}` : ''}

QUESTION CONTEXT:
Subject: ${question.subject}
Topic: ${question.topic}
Prompt: ${questionDetails?.prompt || questionDetails?.question || 'Extended response prompt'}
${stimulusBlock}

STUDENT ESSAY:
${essay}

THEIR SCORE: ${questionScore}/10

Provide feedback in this EXACT format:

**What You Did Well:**
[2-3 sentences mentioning SPECIFIC content from their essay - quote a phrase they wrote or reference specific ideas. Be genuine and specific.]

**What Needs Improvement:**
[2-3 sentences explaining what was missing - which sources weren't used, what organization issues exist, what the claim lacks, etc.]

**How to Get a Higher Score:**
[Write a detailed 4-6 sentence explanation showing them exactly how to improve. ${learningStyle.learnBest === 'Listening to explanations' ? 'Write conversationally like you\'re talking them through it.' : learningStyle.learnBest === 'Seeing examples' ? 'Use clear steps and structure.' : 'Focus on actionable strategies.'} For example:
- If they didn't use both sources, show them HOW to integrate evidence from Source 2
- If organization is weak, show them a simple outline structure (Intro with claim → Body paragraph 1 with evidence from Source 1 → Body paragraph 2 with evidence from Source 2 → Conclusion)
- If their claim is unclear, show them how to write a stronger thesis statement
Be specific and instructional.]

${questionScore < 8 ? `
**Example of Stronger Writing:**
[Write a 3-4 sentence example paragraph that demonstrates the level expected. Show them how to:
- State a clear claim
- Integrate evidence from BOTH sources
- Explain the connection between the evidence and the claim
Make this concrete and related to their actual prompt.]
` : ''}

**Next Time, Remember:**
- [First actionable tip]
- [Second actionable tip]
- [Third actionable tip]

IMPORTANT STYLE REQUIREMENTS:
${learningStyle.learnBest === 'Listening to explanations' 
  ? '- Use warm, conversational language like you\'re sitting with them\n- Explain things as if talking out loud\n- Use phrases like "Here\'s what I want you to try" and "Let\'s think about this together"'
  : learningStyle.learnBest === 'Seeing examples'
  ? '- Use clear visual structure with line breaks and bullet points\n- Provide concrete examples\n- Make it easy to scan and follow'
  : '- Focus on clear action steps they can practice\n- Give them specific strategies to try\n- Make it practical and doable'
}

${learningStyle.worriedSubject === question.subject 
  ? `EXTRA ENCOURAGEMENT NEEDED: This student is worried about ${question.subject}. Be especially supportive and reassuring. Acknowledge their effort and progress while still being honest about areas for growth.`
  : ''
}

Keep total length 300-350 words. Be encouraging but honest. Focus on showing them HOW to improve, not just WHAT to improve.`;

        console.log('💬 Requesting feedback from AI...');
        const feedbackResponse = await agent.stream([{ role: 'user', content: feedbackPrompt }]);
        
        for await (const chunk of feedbackResponse.textStream) {
          feedbackText += chunk;
        }
        
        console.log('✅ Feedback generated, length:', feedbackText.length);

      } else if ((isFreeResponse || isGedExtendedResponse) && isMathOrScience) {
        // Math/Science free response - DO NOT SCORE, provide detailed feedback based on learning style
        console.log('📐 Math/Science free response - skipping AI scoring (will be scored by score-question API)');
        
        const correctAnswer = questionDetails?.answer || 'the correct answer';
        
        if (learningStyle.learnBest === 'Listening to explanations') {
          feedbackText = `Great job showing your work! Let me walk you through how to make your solution even stronger.

**What You Did Well:**
You took the time to show your reasoning, which is exactly what we want to see in math! That's a great habit to build.

**How to Solve This:**
Let me talk you through the correct approach. ${questionDetails?.question ? `The question asks: "${questionDetails.question}"` : ''} The correct answer is **${correctAnswer}**.

Here's how we get there: First, identify what information you're given and what you're looking for. Then, choose the right formula or method for this type of problem. Work through each step carefully, showing your calculations. Finally, check if your answer makes sense - does it match what the question is asking for?

**Next Time, Remember:**
- Re-read the question after you solve it - did you answer what was asked?
- Include units in your final answer (feet, pounds, hours, etc.)
- Double-check your arithmetic to catch simple mistakes

You're building strong problem-solving skills. Keep showing your work like this!`;
        } else if (learningStyle.learnBest === 'Seeing examples') {
          feedbackText = `Nice work showing your reasoning! Let's walk through the correct solution.

**What You Did Well:**
You're showing your work step-by-step, which is exactly the right approach!

**The Correct Solution:**
${questionDetails?.question ? `**Question:** ${questionDetails.question}\n\n` : ''}**Answer:** ${correctAnswer}

**Step-by-Step Breakdown:**
1. **Identify:** What is the question asking for?
2. **Choose:** What formula or method do you need?
3. **Calculate:** Show each step clearly
4. **Check:** Does your answer make sense? Does it answer the question? Are units included?

**Example Walkthrough:**
Let's say the problem gives you a rate and time, and asks for distance. You'd:
- Write down: Distance = Rate × Time
- Plug in the numbers: Distance = 50 mph × 3 hours
- Calculate: Distance = 150 miles
- Check: "Does 150 miles make sense for traveling 50 mph for 3 hours? Yes!"

**Next Time, Remember:**
- Always check: did I answer what was asked?
- Include units in your final answer
- Re-check your calculations

Keep practicing - you're on the right track!`;
        } else {
          feedbackText = `Great work showing your reasoning! Here's how to strengthen your approach.

**What You Did Well:**
You're taking time to show your work, which is exactly what we need to see!

**How to Get the Correct Answer:**
The correct answer is **${correctAnswer}**${questionDetails?.question ? ` for the question: "${questionDetails.question}"` : ''}.

To solve this type of problem:
- **Step 1:** Read carefully and identify what you're solving for
- **Step 2:** Choose your formula or method
- **Step 3:** Show each calculation clearly
- **Step 4:** Check your answer - does it match what the question asks?

**Practice This:**
After you finish solving, ask yourself these questions:
1. Did I answer exactly what was asked?
2. Did I include units if needed?
3. Do my calculations check out?

**Next Time, Remember:**
- Re-read the question after solving
- Double-check your arithmetic
- Make sure your final answer includes proper units

Keep showing your work like this - you're developing great problem-solving habits!`;
        }

      } else {
        // Non-free-response question - detailed feedback based on learning style
        const prompt = isCorrect 
          ? `Student got this ${question.subject} question CORRECT!

Question: "${questionDetails.question}"
Topic: ${question.topic}
Their answer: ${studentAnswer}
Correct answer: ${questionDetails.answer}

Learning style: ${learningStyle.learnBest}

Give encouraging, specific feedback (150-180 words):

**Great Work!**
[2-3 sentences celebrating their success and explaining WHY their answer is correct - reference the specific concept they understood]

**Why This Matters:**
[1-2 sentences explaining the importance of this concept or how it connects to bigger ideas]

**Keep Building This Skill:**
[1-2 sentences with a tip to deepen understanding or a suggestion for how to apply this concept in new ways]

${learningStyle.learnBest === 'Seeing examples' 
  ? `\n**Try This Next:**\n[Suggest one related practice problem or real-world application they could explore]`
  : ''
}

Keep it warm and conversational. Make them feel proud while encouraging continued growth. Use ${learningStyle.learnBest === 'Listening to explanations' ? 'conversational language like you\'re talking to them' : learningStyle.learnBest === 'Seeing examples' ? 'clear structure and examples' : 'actionable next steps'}.`
          : `Student got this ${question.subject} question WRONG.

Question: "${questionDetails.question}"
Topic: ${question.topic}
Student's answer: ${studentAnswer}
Correct answer: ${questionDetails.answer}
${questionDetails.options ? `All options were: ${questionDetails.options.join(', ')}` : ''}

Learning profile:
- Learns best: ${learningStyle.learnBest}
- When wrong, prefers: ${learningStyle.wrongAnswerAction}
${learningStyle.worriedSubject === question.subject ? `- Worried about ${question.subject}` : ''}
${learningStyle.hardFactors ? `- Challenges: ${learningStyle.hardFactors.join(', ')}` : ''}

Provide detailed, instructional feedback (300-350 words) in this EXACT format:

**What Happened:**
[2-3 sentences explaining their specific error. Why might they have chosen their answer? What misconception led to this mistake? Be specific and understanding.]

**The Correct Answer:**
The correct answer is **${questionDetails.answer}**.

[3-4 sentences teaching WHY this is correct. ${learningStyle.learnBest === 'Listening to explanations' ? 'Explain it conversationally like you\'re walking them through it.' : learningStyle.learnBest === 'Seeing examples' ? 'Use clear structure and break it into steps.' : 'Focus on the key concept and action steps.'} Don't just say what's right - explain the underlying concept or reasoning.]

**How to Solve This:**
[4-5 sentences showing them the step-by-step approach to get the right answer. Be instructional. For example:
- Math: "First, identify what you're solving for. Then, choose the formula. Next, plug in the numbers. Finally, solve and check."
- Reading: "Look for key words in the passage. Find evidence that directly answers the question. Eliminate answers that contradict the text."
- Science: "Start with what you know about [concept]. Apply that principle to this situation. Consider how [factor] affects [outcome]."
Make it specific to this question type.]

${learningStyle.wrongAnswerAction === 'Show me an example' ? `
**Let's Try a Similar Problem:**
[Provide a worked example with 4-5 clear steps. Show them exactly how to apply the method you just taught. Make it concrete and related to the same concept. For example, if it's a decimal problem, show another decimal problem solved step by step.]
` : `
**Why This Concept Matters:**
[2-3 sentences explaining the underlying principle and why understanding this will help them with future questions]
`}

**Next Time, Remember:**
- [First specific, actionable tip related to this concept]
- [Second tip - could be about how to avoid the error they made]
- [Third tip - could be about how to check their work]

CRITICAL STYLE REQUIREMENTS:
${learningStyle.learnBest === 'Listening to explanations' 
  ? '- Write in a warm, conversational tone like you\'re sitting next to them explaining\n- Use phrases like "Let\'s think about this together" and "Here\'s what I want you to notice"\n- Explain concepts as if talking out loud'
  : learningStyle.learnBest === 'Seeing examples'
  ? '- Use clear visual structure with line breaks between sections\n- Provide concrete examples and visual analogies\n- Make it scannable and easy to follow step by step'
  : '- Focus on clear, actionable practice steps\n- Give them specific strategies they can try immediately\n- Make the path forward crystal clear'
}

${learningStyle.worriedSubject === question.subject 
  ? `IMPORTANT: This student is worried about ${question.subject}. Be EXTRA encouraging and supportive. Start with empathy, acknowledge that this subject can feel challenging, and reassure them that making mistakes is part of the learning process. End on an encouraging note about their progress.`
  : ''
}

BE INSTRUCTIONAL: Don't just tell them what's wrong - TEACH them how to get it right. Show them the thought process, the method, the approach. Make them feel like they learned something valuable.`;

        const response = await agent.stream([{ role: 'user', content: prompt }]);
        
        for await (const chunk of response.textStream) {
          feedbackText += chunk;
        }
      }

      // Update result with feedback and score (score will be null for Math/Science free response)
      const updateData: any = { feedback: feedbackText };
      if (questionScore !== null) {
        updateData.question_score = questionScore;
      }

      console.log('💾 Saving to database:', {
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
        console.error('❌ Database update error:', updateError);
        return {
          resultId,
          feedbackGenerated: false,
          questionScore: null,
          error: 'Failed to save feedback',
        };
      }

      console.log('✅ Successfully saved feedback and score to database');

      return {
        resultId,
        feedbackGenerated: true,
        questionScore,
      };

    } catch (error) {
      console.error('❌ Error generating feedback:', error);
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