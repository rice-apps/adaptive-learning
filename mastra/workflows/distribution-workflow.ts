import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const distributionInputSchema = z.object({
  studentId: z.string(),
  totalQuestions: z.number(),
  focusAreas: z.array(z.string()).optional(),
  requiredQuestionIds: z.array(z.string()).optional(),
});

const distributionOutputSchema = z.object({
  topicDistribution: z.record(z.string(), z.number()),
  reasoning: z.string(),
  selectedQuestionIds: z.array(z.string()),
});

const generateDistributionStep = createStep({
  id: 'generate-topic-distribution',
  description: 'Intelligently creates topic distribution based on student profile',
  inputSchema: distributionInputSchema,
  outputSchema: distributionOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) throw new Error('Input data not found');

    const { studentId, totalQuestions, focusAreas, requiredQuestionIds = [] } = inputData;

    // Get student data
    const { data: studentData } = await supabase
      .from('Students')
      .select('learning_style, attributes')
      .eq('id', studentId)
      .single();

    if (!studentData) throw new Error('Student not found');

    const learningStyle = typeof studentData.learning_style === 'string'
      ? JSON.parse(studentData.learning_style)
      : (studentData.learning_style || {});

    const attributes = typeof studentData.attributes === 'string'
      ? JSON.parse(studentData.attributes)
      : (studentData.attributes || {});

    // Get student's past performance
    const { data: pastResults } = await supabase
      .from('Results')
      .select(`
        question_id,
        student_answer,
        student_answer_json,
        Questions!inner(topic, question_details, subject, question_type)
      `)
      .eq('student_id', studentId);

    const performanceByTopic: Record<string, { correct: number; total: number; subject: string }> = {};
    
    if (pastResults) {
      for (const result of pastResults) {
        const topic = (result as any).Questions.topic;
        const subject = (result as any).Questions.subject;
        const questionType = (result as any).Questions.question_type;
        const rawDetails = (result as any).Questions.question_details;
        const questionDetails = typeof rawDetails === 'string' 
          ? JSON.parse(rawDetails) 
          : rawDetails;

        // Skip extended response items for correctness-based distribution (not correct/incorrect)
        if (questionType === 'ged_extended_response') continue;

        let isCorrect = false;
        if (questionType === 'drag_drop') {
          const correctAnswers = (questionDetails?.qa_pairs || []).map((p: any) => p.answer);
          let arr: any[] | null = null;
          if (Array.isArray((result as any).student_answer_json)) arr = (result as any).student_answer_json;
          if (!arr && typeof (result as any).student_answer === 'string') {
            try {
              const parsed = JSON.parse((result as any).student_answer);
              if (Array.isArray(parsed)) arr = parsed;
            } catch {
              // ignore
            }
          }
          if (arr && arr.length === correctAnswers.length) {
            isCorrect = arr.every((v, i) => v === correctAnswers[i]);
          } else {
            isCorrect = false;
          }
        } else {
          isCorrect = String((result as any).student_answer) === String(questionDetails?.answer);
        }

        if (!performanceByTopic[topic]) {
          performanceByTopic[topic] = { correct: 0, total: 0, subject };
        }
        performanceByTopic[topic].total++;
        if (isCorrect) performanceByTopic[topic].correct++;
      }
    }

    // Get available topics and subjects from database
    const { data: allQuestions } = await supabase
      .from('Questions')
      .select('topic, subject');

    if (!allQuestions) throw new Error('No questions available in database');

    // Group topics by subject
    const topicsBySubject: Record<string, string[]> = {};
    allQuestions.forEach(q => {
      if (!topicsBySubject[q.subject]) {
        topicsBySubject[q.subject] = [];
      }
      if (!topicsBySubject[q.subject].includes(q.topic)) {
        topicsBySubject[q.subject].push(q.topic);
      }
    });

    // Determine which subjects to focus on
    let relevantTopics: string[] = [];
    
    if (focusAreas && focusAreas.length > 0) {
      // Filter topics based on focus areas
      focusAreas.forEach(area => {
        const areaLower = area.toLowerCase();
        
        // Map common focus area names to subjects
        if (areaLower.includes('math')) {
          relevantTopics.push(...(topicsBySubject['Math'] || []));
        } else if (areaLower.includes('reading') || areaLower.includes('language') || areaLower.includes('rla')) {
          relevantTopics.push(...(topicsBySubject['Reading'] || []));
          relevantTopics.push(...(topicsBySubject['Language Arts'] || []));
        } else if (areaLower.includes('science')) {
          relevantTopics.push(...(topicsBySubject['Science'] || []));
        } else if (areaLower.includes('social') || areaLower.includes('studies')) {
          relevantTopics.push(...(topicsBySubject['Social Studies'] || []));
        } else {
          // If focus area matches a subject name directly
          Object.keys(topicsBySubject).forEach(subject => {
            if (subject.toLowerCase().includes(areaLower)) {
              relevantTopics.push(...(topicsBySubject[subject] || []));
            }
          });
        }
      });
      
      // Remove duplicates
      relevantTopics = [...new Set(relevantTopics)];
    }
    
    // If no focus areas or no topics found, use all topics
    if (relevantTopics.length === 0) {
      relevantTopics = allQuestions.map(q => q.topic);
      relevantTopics = [...new Set(relevantTopics)];
    }

    const agent = mastra?.getAgent('distributionAgent');
    if (!agent) throw new Error('Distribution agent not found');

    // Build subject breakdown for context
    const subjectBreakdown = Object.entries(topicsBySubject)
      .map(([subject, topics]) => `${subject}: ${topics.length} topics available`)
      .join('\n');

    const prompt = `You are an expert GED quiz designer. Create an intelligent topic distribution for a quiz.

STUDENT PROFILE:
- Learning Style: ${learningStyle?.learnBest || 'Not specified'}
- Worried About: ${learningStyle?.worriedSubject || 'None'}
- Challenges: ${learningStyle?.hardFactors?.join(', ') || 'None'}
- Strengths (self-reported): ${attributes?.['strength-skill']?.join(', ') || 'None identified'}
- Weaknesses (self-reported): ${attributes?.['weaknesses-skill']?.join(', ') || 'None identified'}

PAST PERFORMANCE BY TOPIC:
${Object.entries(performanceByTopic).length > 0 
  ? Object.entries(performanceByTopic).map(([topic, perf]) => 
      `- ${topic} (${perf.subject}): ${perf.correct}/${perf.total} correct (${Math.round((perf.correct/perf.total)*100)}%)`
    ).join('\n')
  : 'No past performance data available'}

QUIZ REQUIREMENTS:
- Total Questions: ${totalQuestions}
${focusAreas && focusAreas.length > 0 ? `- Focus Areas: ${focusAreas.join(', ')}` : '- No specific focus areas (use all subjects)'}

AVAILABLE SUBJECTS:
${subjectBreakdown}

AVAILABLE TOPICS (you MUST choose from this exact list):
${relevantTopics.slice(0, 50).map(t => `- ${t}`).join('\n')}
${relevantTopics.length > 50 ? `... and ${relevantTopics.length - 50} more topics` : ''}

YOUR TASK:
Select exactly ${totalQuestions} questions distributed across 2-5 different topics from the list above.

Guidelines:
1. Use the EXACT topic names from the list (copy/paste them exactly)
2. Prioritize topics where student performed poorly (<70%) or has no experience
3. If student is worried about a subject, include some easier topics from that subject
4. Include variety across different topics
5. Total must equal exactly ${totalQuestions}
6. Choose topics that align with focus areas: ${focusAreas?.join(', ') || 'all subjects'}

Respond with a JSON object:
{
  "topicDistribution": {
    "Exact Topic Name 1": number_of_questions,
    "Exact Topic Name 2": number_of_questions
  },
  "reasoning": "Brief 1-2 sentence explanation of your distribution strategy"
}

CRITICAL: 
- Topic names must EXACTLY match the list above (copy them exactly)
- No markdown, no code blocks, just pure JSON
- Start with { and end with }`;

    const response = await agent.stream([{ role: 'user', content: prompt }]);

    let responseText = '';
    for await (const chunk of response.textStream) {
      responseText += chunk;
    }

    // Parse the JSON response
    let cleanedResponse = responseText.trim()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '');
    
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    let result;
    try {
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${cleanedResponse.substring(0, 200)}...`);
    }

    if (!result.topicDistribution || !result.reasoning) {
      throw new Error('AI response missing required fields');
    }

    // Validate that total questions match
    const totalFromDistribution = Object.values(result.topicDistribution).reduce(
      (sum: number, count: any) => sum + Number(count), 
      0
    );

    if (totalFromDistribution !== totalQuestions) {
      console.warn(`Warning: AI generated ${totalFromDistribution} questions instead of ${totalQuestions}`);
    }

    // Select questions based on distribution with duplicate prevention
    const selectedQuestionIds: string[] = [...requiredQuestionIds];
    const usedQuestionIds = new Set(requiredQuestionIds);

    for (const [topic, count] of Object.entries(result.topicDistribution) as [string, number][]) {
      const exclusionList = Array.from(usedQuestionIds);
      
      let query = supabase
        .from('Questions')
        .select('id')
        .eq('topic', topic);
      
      if (exclusionList.length > 0) {
        query = query.not('id', 'in', `(${exclusionList.join(',')})`);
      }

      const { data: questions, error } = await query;

      if (error) {
        console.error(`Error fetching questions for topic "${topic}":`, error);
        continue;
      }

      if (!questions || questions.length === 0) {
        console.warn(`No questions available for topic: "${topic}"`);
        continue;
      }

      const questionsToAdd = questions.slice(0, count);
      
      if (questionsToAdd.length < count) {
        console.warn(`Topic "${topic}" requested ${count} questions but only ${questionsToAdd.length} available`);
      }

      questionsToAdd.forEach(q => {
        if (!usedQuestionIds.has(q.id)) {
          selectedQuestionIds.push(q.id);
          usedQuestionIds.add(q.id);
        }
      });
    }

    if (selectedQuestionIds.length < totalQuestions) {
      console.warn(`Only found ${selectedQuestionIds.length} questions out of ${totalQuestions} requested`);
    }

    return {
      topicDistribution: result.topicDistribution,
      reasoning: result.reasoning,
      selectedQuestionIds,
    };
  },
});

const distributionWorkflow = createWorkflow({
  id: 'distribution-workflow',
  inputSchema: distributionInputSchema,
  outputSchema: distributionOutputSchema,
})
  .then(generateDistributionStep);

distributionWorkflow.commit();

export { distributionWorkflow, generateDistributionStep };