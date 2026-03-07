import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { createClient } from '@/lib/supabase/server';
import { mastra } from '@/mastra';

type QuestionType = 'mcq' | 'free_response' | 'drag_drop' | 'ged_extended_response';

interface ParsedQuestion {
  subject: string;
  topic: string;
  question_type: QuestionType;
  question_details: Record<string, any>;
}

const SUPPORTED_EXTENSIONS = ['pdf', 'txt', 'md', 'docx'] as const;

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function normalizeQuestionType(type: string): QuestionType {
  const value = (type || '').toLowerCase().trim();
  if (value === 'mcq' || value.includes('multiple')) return 'mcq';
  if (value === 'drag_drop' || value.includes('drag') || value.includes('match')) return 'drag_drop';
  if (value === 'ged_extended_response' || value.includes('extended') || value.includes('essay')) {
    return 'ged_extended_response';
  }
  return 'free_response';
}

function sanitizeQuestionDetails(
  questionType: QuestionType,
  details: Record<string, any> | null | undefined
): Record<string, any> {
  const d = details || {};
  if (questionType === 'mcq') {
    const options = Array.isArray(d.options)
      ? d.options.map((o: unknown) => String(o ?? '').trim()).filter(Boolean)
      : [];
    const normalizedOptions = [...options];
    while (normalizedOptions.length < 4) normalizedOptions.push(`Option ${normalizedOptions.length + 1}`);
    return {
      question: String(d.question || '').trim(),
      ...(d.passage ? { passage: String(d.passage).trim() } : {}),
      options: normalizedOptions.slice(0, 4),
      correct_answer: String(d.correct_answer || normalizedOptions[0] || '').trim(),
      ...(d.explanation ? { explanation: String(d.explanation).trim() } : {}),
    };
  }

  if (questionType === 'drag_drop') {
    const pairs = Array.isArray(d.pairs)
      ? d.pairs
          .map((pair: Record<string, any>) => ({
            left: String(pair?.left || '').trim(),
            right: String(pair?.right || '').trim(),
          }))
          .filter((pair: { left: string; right: string }) => pair.left && pair.right)
      : [];
    return {
      question: String(d.question || '').trim(),
      pairs: pairs.slice(0, 12),
    };
  }

  if (questionType === 'ged_extended_response') {
    const minWords = Number(d?.response_fields?.[0]?.min_words ?? 200);
    return {
      question: String(d.question || '').trim(),
      ...(d.passage ? { passage: String(d.passage).trim() } : {}),
      response_fields: [
        {
          id: 'essay',
          label: 'Response',
          min_words: Number.isFinite(minWords) ? Math.max(50, Math.min(1000, minWords)) : 200,
        },
      ],
    };
  }

  return {
    question: String(d.question || '').trim(),
    ...(d.passage ? { passage: String(d.passage).trim() } : {}),
    answer: String(d.answer || '').trim(),
  };
}

function isValidQuestion(question: ParsedQuestion) {
  if (!question.subject || !question.topic || !question.question_type) return false;
  const d = question.question_details || {};

  if (question.question_type === 'mcq') {
    return (
      !!d.question &&
      Array.isArray(d.options) &&
      d.options.length === 4 &&
      d.options.every((o: unknown) => String(o ?? '').trim()) &&
      !!d.correct_answer
    );
  }
  if (question.question_type === 'drag_drop') {
    return !!d.question && Array.isArray(d.pairs) && d.pairs.length >= 2;
  }
  if (question.question_type === 'ged_extended_response') {
    return !!d.question && Array.isArray(d.response_fields) && d.response_fields.length > 0;
  }
  return !!d.question && !!d.answer;
}

function extractFirstJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

async function extractTextFromFile(file: File) {
  const extension = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new Error(`Unsupported file type: .${extension || 'unknown'}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === 'txt' || extension === 'md') {
    return buffer.toString('utf-8');
  }

  if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const workerHost = globalThis as typeof globalThis & {
      pdfjsWorker?: { WorkerMessageHandler?: unknown };
    };
    if (!workerHost.pdfjsWorker?.WorkerMessageHandler) {
      const workerModule = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      workerHost.pdfjsWorker = {
        WorkerMessageHandler: workerModule.WorkerMessageHandler,
      };
    }

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: Record<string, any>) => ('str' in item ? String(item.str) : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) pageTexts.push(text);
    }
    return pageTexts.join('\n\n');
  }

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const pastedText = String(formData.get('text') || '').trim();

    let sourceText = '';
    let sourceName = 'Pasted text';

    if (file instanceof File && file.size > 0) {
      sourceName = file.name;
      sourceText = (await extractTextFromFile(file)).trim();
    } else if (pastedText) {
      sourceText = pastedText;
    }

    if (!sourceText) {
      return NextResponse.json(
        { error: 'Please upload a file or paste text to import questions.' },
        { status: 400 }
      );
    }

    // Keep inference bounded for predictable latency/cost.
    const truncatedText = sourceText.slice(0, 70000);
    const parserAgent = mastra.getAgent('questionImportParserAgent');
    const prompt = `
Parse the following educator quiz content into structured questions.

Return only JSON with this shape:
{ "questions": [ ... ] }

If you cannot confidently parse a section into a valid question schema, skip it.

Source: ${sourceName}
Content:
"""
${truncatedText}
"""
`;

    const response = await parserAgent.stream([{ role: 'user', content: prompt }]);
    let rawOutput = '';
    for await (const chunk of response.textStream) rawOutput += chunk;

    const jsonText = extractFirstJsonObject(rawOutput);
    if (!jsonText) {
      return NextResponse.json(
        { error: 'The AI parser returned an invalid response. Please try again.' },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonText) as { questions?: Array<Record<string, any>> };
    const normalized = (parsed.questions || [])
      .map((q) => {
        const questionType = normalizeQuestionType(String(q.question_type || ''));
        return {
          subject: String(q.subject || 'Reading/Language Arts').trim(),
          topic: String(q.topic || 'Diagnostic').trim(),
          question_type: questionType,
          question_details: sanitizeQuestionDetails(questionType, q.question_details),
        } satisfies ParsedQuestion;
      })
      .filter(isValidQuestion);

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions were detected. Try cleaner formatting or paste a smaller section.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      questions: normalized,
      sourceName,
      extractedCharacters: sourceText.length,
      parsedCount: normalized.length,
    });
  } catch (error) {
    console.error('Error importing educator questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import questions' },
      { status: 500 }
    );
  }
}
