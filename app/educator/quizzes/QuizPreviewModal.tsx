'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type StimulusDocument = {
  id: string;
  title: string;
  intro: string | null;
  time_limit_minutes: number | null;
  references: unknown;
  source_pdf_storage_path: string | null;
};

type StimulusSource = {
  id: string;
  document_id: string;
  sort_order: number;
  label: string | null;
  genre: string | null;
  title: string | null;
  author: string | null;
  publication: string | null;
  body_markdown: string;
};

interface QuizTemplate {
  id: string;
  name: string;
  questions: string[];
}

interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: QuizTemplate | null;
}

function parseDetails(q: any) {
  if (!q) return null;
  return typeof q.question_details === 'string'
    ? JSON.parse(q.question_details)
    : q.question_details;
}

export default function QuizPreviewModal({
  isOpen,
  onClose,
  template,
}: QuizPreviewModalProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stimulusByDocId, setStimulusByDocId] = useState<
    Record<string, { document: StimulusDocument; sources: StimulusSource[] }>
  >({});

  useEffect(() => {
    if (isOpen && template?.id) {
      setCurrentIdx(0);
      setStimulusByDocId({});
      fetchTemplateQuestions();
    }
  }, [isOpen, template?.id]);

  const fetchTemplateQuestions = async () => {
    if (!template?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/educator/quiz-templates/${template.id}`);
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const ensureStimulusLoaded = async (stimulusDocumentId: string) => {
    if (!stimulusDocumentId || stimulusByDocId[stimulusDocumentId]) return;

    const supabase = createClient();
    const { data: doc, error: docError } = await supabase
      .from('question_stimulus_documents')
      .select('*')
      .eq('id', stimulusDocumentId)
      .single();

    if (docError || !doc) return;

    const { data: sources } = await supabase
      .from('question_stimulus_sources')
      .select('*')
      .eq('document_id', stimulusDocumentId)
      .order('sort_order', { ascending: true });

    setStimulusByDocId((prev) => ({
      ...prev,
      [stimulusDocumentId]: {
        document: doc as StimulusDocument,
        sources: (sources as StimulusSource[]) || [],
      },
    }));
  };

  const currentQ = questions[currentIdx];
  const details = parseDetails(currentQ);

  useEffect(() => {
    if (!currentQ || currentQ.question_type !== 'ged_extended_response') return;
    const d = parseDetails(currentQ);
    const stimulusDocumentId = d?.stimulus_document_id;
    if (stimulusDocumentId) ensureStimulusLoaded(stimulusDocumentId);
  }, [currentQ?.id]);

  const progress =
    questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const handlePrev = () =>
    setCurrentIdx((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="!max-w-[95vw] w-[95vw] max-h-[90vh] h-[85vh] flex flex-col p-0 overflow-hidden"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Preview: {template?.name ?? 'Quiz'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Read-only preview — questions appear as students will see them
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading...
            </div>
          ) : questions.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No questions in this quiz
            </div>
          ) : !currentQ ? null : currentQ.question_type ===
            'ged_extended_response' ? (
            <GedExtendedResponsePreview
              currentQ={currentQ}
              details={details}
              progress={progress}
              questions={questions}
              currentIdx={currentIdx}
              stimulusByDocId={stimulusByDocId}
            />
          ) : (
            <StandardQuestionPreview
              currentQ={currentQ}
              details={details}
              progress={progress}
              questions={questions}
              currentIdx={currentIdx}
            />
          )}
        </div>

        {!loading && questions.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Question {currentIdx + 1} of {questions.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIdx === questions.length - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StandardQuestionPreview({
  currentQ,
  details,
  progress,
  questions,
  currentIdx,
}: {
  currentQ: any;
  details: any;
  progress: number;
  questions: any[];
  currentIdx: number;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-gray-100 rounded-full">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-bold text-gray-400">
          QUESTION {currentIdx + 1} OF {questions.length}
        </p>
      </div>

      <div className="space-y-6">
        {details?.passage && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
              Reading Passage
            </p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {details.passage}
            </p>
          </div>
        )}
        <div className="bg-zinc-50 rounded-3xl p-10 border border-zinc-100">
          <p className="text-lime-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
            {currentQ.subject} • {currentQ.topic}
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 leading-tight">
            {currentQ.question_type === 'drag_drop'
              ? 'Match the following correctly:'
              : details?.question}
          </h2>
        </div>

        <div className="space-y-4">
          {currentQ.question_type === 'mcq' &&
            details?.options?.map((opt: string) => (
              <div
                key={opt}
                className="w-full text-left p-6 rounded-2xl border-2 border-zinc-100 bg-white font-medium"
              >
                {opt}
              </div>
            ))}

          {currentQ.question_type === 'free_response' && (
            <div className="rounded-2xl p-6 min-h-[120px] border-2 border-zinc-100 bg-gray-50">
              <p className="text-sm text-gray-500 italic">
                Student will type their answer here
              </p>
            </div>
          )}

          {currentQ.question_type === 'drag_drop' &&
            details?.qa_pairs?.map(
              (pair: { question: string; answer: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100"
                >
                  <span className="flex-1 font-bold text-zinc-700">
                    {pair.question}
                  </span>
                  <span className="text-sm text-gray-500">→</span>
                  <span className="text-zinc-700">{pair.answer}</span>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}

function GedExtendedResponsePreview({
  currentQ,
  details,
  progress,
  questions,
  currentIdx,
  stimulusByDocId,
}: {
  currentQ: any;
  details: any;
  progress: number;
  questions: any[];
  currentIdx: number;
  stimulusByDocId: Record<
    string,
    { document: StimulusDocument; sources: StimulusSource[] }
  >;
}) {
  const stimulusDocumentId = details?.stimulus_document_id;
  const stimulus = stimulusDocumentId
    ? stimulusByDocId[stimulusDocumentId]
    : null;

  const minWords =
    details?.response_fields?.find((f: any) => f.id === 'essay')
      ?.min_words ?? details?.response_fields?.[0]?.min_words ?? null;

  return (
    <div className="h-full flex">
      {/* Left: stimulus */}
      <div className="w-1/2 min-w-[360px] border-r border-zinc-100 bg-zinc-50 overflow-y-auto">
        <div className="p-6">
          {!stimulus ? (
            <div className="text-sm text-gray-500">
              Loading reading materials…
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {stimulus.document.title}
                </h2>
                {stimulus.document.time_limit_minutes && (
                  <p className="text-xs font-bold text-gray-400 mt-2">
                    Suggested time: {stimulus.document.time_limit_minutes}{' '}
                    minutes
                  </p>
                )}
                {stimulus.document.intro && (
                  <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">
                    {stimulus.document.intro}
                  </p>
                )}
              </div>
              {stimulus.sources.map((src) => (
                <div key={src.id} className="space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                    {src.label || `Source ${src.sort_order}`}
                  </div>
                  <div className="space-y-1">
                    {src.title && (
                      <div className="font-semibold text-zinc-900">
                        {src.title}
                      </div>
                    )}
                    {(src.author || src.publication || src.genre) && (
                      <div className="text-xs text-gray-500">
                        {[src.author, src.publication, src.genre]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {src.body_markdown}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: prompt */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-bold text-gray-400">
              QUESTION {currentIdx + 1} OF {questions.length}
            </p>
          </div>

          <div className="bg-white">
            <h3 className="text-2xl font-bold text-zinc-900 leading-tight">
              {details?.prompt || 'Extended Response'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Write a well-organized response that uses evidence from the
              source materials.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">
              Student response area
            </div>
            <div className="rounded-2xl p-6 min-h-[320px] border-2 border-zinc-100 bg-gray-50">
              <p className="text-sm text-gray-500 italic">
                Student will write their essay here
              </p>
              {typeof minWords === 'number' && (
                <p className="text-xs text-gray-500 mt-2">
                  Minimum {minWords} words required
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
