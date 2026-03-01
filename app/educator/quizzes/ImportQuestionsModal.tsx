'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUp, Sparkles, Loader2 } from 'lucide-react';

type QuestionType = 'mcq' | 'free_response' | 'drag_drop' | 'ged_extended_response';

interface DraftQuestion {
  subject: string;
  topic: string;
  question_type: QuestionType;
  question_details: Record<string, any>;
  included: boolean;
}

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const SUBJECTS = ['Math', 'Science', 'Social Studies', 'Reading/Language Arts'];

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  Math: [
    'Number operations & number sense',
    'Fractions, decimals, ratios, and proportions',
    'Percents and rates',
    'Measurement & geometry (area, volume, perimeter)',
    'Expressions, equations, and inequalities',
    'Linear functions & graphing',
    'Polynomials & factoring',
    'Word problems and real-world applications',
  ],
  Science: [
    'Cells, genetics, evolution, and ecosystems',
    'Matter, motion, energy, and force',
    'Climate, Earth systems, and the solar system',
    'Experimental design, data interpretation, and analysis',
  ],
  'Social Studies': [
    'The U.S. Constitution, branches of government, rights, and responsibilities',
    'Colonization, Civil War, Reconstruction, Civil Rights Movement, modern America',
    'Supply and demand, markets, and government influence',
    'Global interdependence, historical movements, and geography skills',
  ],
  'Reading/Language Arts': [
    'Comprehension of informational and literary texts',
    'Inference and evidence-based reasoning',
    "Evaluating claims, bias, and author's purpose",
    'Writing evidence-based responses (extended response/essay)',
    'Sentence structure & punctuation',
    'Grammar usage, capitalization, and word choice',
    'Diagnostic',
  ],
};

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'free_response', label: 'Free Response' },
  { value: 'drag_drop', label: 'Drag & Drop (Matching)' },
  { value: 'ged_extended_response', label: 'Extended Response (Essay)' },
];

function defaultDetailsForType(type: QuestionType) {
  if (type === 'mcq') {
    return {
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
    };
  }
  if (type === 'free_response') {
    return {
      question: '',
      answer: '',
    };
  }
  if (type === 'drag_drop') {
    return {
      question: '',
      pairs: [
        { left: '', right: '' },
        { left: '', right: '' },
      ],
    };
  }
  return {
    question: '',
    response_fields: [{ id: 'essay', label: 'Response', min_words: 200 }],
  };
}

function validateQuestion(question: DraftQuestion) {
  const d = question.question_details || {};
  if (!question.subject || !question.topic) return false;
  if (question.question_type === 'mcq') {
    return (
      !!d.question &&
      Array.isArray(d.options) &&
      d.options.length === 4 &&
      d.options.every((o: unknown) => String(o ?? '').trim()) &&
      !!d.correct_answer
    );
  }
  if (question.question_type === 'free_response') {
    return !!d.question && !!d.answer;
  }
  if (question.question_type === 'drag_drop') {
    return (
      !!d.question &&
      Array.isArray(d.pairs) &&
      d.pairs.filter((pair: Record<string, any>) => pair?.left && pair?.right).length >= 2
    );
  }
  return !!d.question;
}

export default function ImportQuestionsModal({ isOpen, onClose, onSaved }: ImportQuestionsModalProps) {
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [createTemplate, setCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const includedQuestions = useMemo(
    () => draftQuestions.filter((q) => q.included),
    [draftQuestions]
  );

  const hasInput = !!selectedFile || !!textInput.trim();
  const canSave =
    includedQuestions.length > 0 &&
    includedQuestions.every(validateQuestion) &&
    (!createTemplate || !!templateName.trim());

  const resetState = () => {
    setTextInput('');
    setSelectedFile(null);
    setParsing(false);
    setSaving(false);
    setError('');
    setSuccessMessage('');
    setDraftQuestions([]);
    setCreateTemplate(false);
    setTemplateName('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const updateDraftQuestion = (index: number, updates: Partial<DraftQuestion>) => {
    setDraftQuestions((prev) =>
      prev.map((question, i) => (i === index ? { ...question, ...updates } : question))
    );
  };

  const updateQuestionDetails = (index: number, updates: Record<string, any>) => {
    setDraftQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? { ...question, question_details: { ...question.question_details, ...updates } }
          : question
      )
    );
  };

  const handleParse = async () => {
    if (!hasInput) return;
    setParsing(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      if (selectedFile) formData.append('file', selectedFile);
      if (textInput.trim()) formData.append('text', textInput.trim());

      const res = await fetch('/api/educator/questions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse input');

      const parsedDrafts: DraftQuestion[] = (data.questions || []).map((q: DraftQuestion) => ({
        ...q,
        included: true,
      }));
      setDraftQuestions(parsedDrafts);
      setTemplateName(`Imported Quiz - ${new Date().toLocaleDateString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse input');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const saveResponses = await Promise.all(
        includedQuestions.map(async (question) => {
          const res = await fetch('/api/educator/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: question.subject,
              topic: question.topic,
              question_type: question.question_type,
              question_details: question.question_details,
            }),
          });
          const data = await res.json();
          return { ok: res.ok, data };
        })
      );

      const successfulQuestions = saveResponses
        .filter((result) => result.ok)
        .map((result) => result.data.question?.id)
        .filter(Boolean);

      const failedCount = saveResponses.length - successfulQuestions.length;

      if (successfulQuestions.length === 0) {
        throw new Error('None of the selected questions were saved. Please review and try again.');
      }

      if (createTemplate) {
        const templateRes = await fetch('/api/educator/quiz-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: templateName.trim(),
            questions: successfulQuestions,
          }),
        });
        const templateData = await templateRes.json();
        if (!templateRes.ok) {
          throw new Error(templateData.error || 'Questions saved, but creating the quiz template failed.');
        }
      }

      const templateMessage = createTemplate
        ? ' and a quiz template'
        : '';
      const failureMessage =
        failedCount > 0 ? ` (${failedCount} question${failedCount === 1 ? '' : 's'} failed)` : '';
      setSuccessMessage(
        `Saved ${successfulQuestions.length} question${successfulQuestions.length === 1 ? '' : 's'}${templateMessage}${failureMessage}.`
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save imported questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[92vw] w-[92vw] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Questions with AI
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
          <p className="font-medium">Upload or paste content, then review every parsed question before saving.</p>
          <p className="text-blue-800 mt-1">
            Supported formats: <span className="font-medium">.pdf .docx .txt .md</span>. Nothing is saved until you click save.
          </p>
        </div>

        {draftQuestions.length === 0 ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Upload file (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.txt,.md,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Or paste raw text (optional)</Label>
              <Textarea
                rows={10}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your worksheet, exam, or question list here..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{includedQuestions.length} selected</Badge>
                <Badge variant="outline">{draftQuestions.length} parsed</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftQuestions((prev) =>
                    prev.map((question) => ({ ...question, included: !question.included }))
                  );
                }}
              >
                Toggle all
              </Button>
            </div>

            {draftQuestions.map((question, index) => {
              const details = question.question_details || {};
              const topicOptions = TOPICS_BY_SUBJECT[question.subject] || [];
              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 space-y-3 ${question.included ? 'bg-white' : 'bg-gray-50 opacity-70'}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <Checkbox
                        checked={question.included}
                        onCheckedChange={(checked) => updateDraftQuestion(index, { included: !!checked })}
                      />
                      Include question {index + 1}
                    </label>
                    <Badge variant="outline">
                      {QUESTION_TYPES.find((type) => type.value === question.question_type)?.label || question.question_type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select
                      value={question.subject}
                      onValueChange={(value) =>
                        updateDraftQuestion(index, {
                          subject: value,
                          topic: TOPICS_BY_SUBJECT[value]?.[0] || 'Diagnostic',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={question.topic}
                      onValueChange={(value) => updateDraftQuestion(index, { topic: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topicOptions.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                        {!topicOptions.includes(question.topic) && (
                          <SelectItem value={question.topic}>{question.topic}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    <Select
                      value={question.question_type}
                      onValueChange={(value: QuestionType) =>
                        updateDraftQuestion(index, {
                          question_type: value,
                          question_details: defaultDetailsForType(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Question type" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(question.question_type === 'mcq' || question.question_type === 'free_response' || question.question_type === 'ged_extended_response') && (
                    <>
                      <div className="space-y-1">
                        <Label>Question</Label>
                        <Textarea
                          rows={3}
                          value={details.question || ''}
                          onChange={(e) => updateQuestionDetails(index, { question: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Passage (optional)</Label>
                        <Textarea
                          rows={3}
                          value={details.passage || ''}
                          onChange={(e) => updateQuestionDetails(index, { passage: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {question.question_type === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Options + correct answer</Label>
                      {(details.options || ['', '', '', '']).map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-5">{String.fromCharCode(65 + optionIndex)}.</span>
                          <Input
                            value={option}
                            onChange={(e) => {
                              const nextOptions = [...(details.options || ['', '', '', ''])];
                              nextOptions[optionIndex] = e.target.value;
                              updateQuestionDetails(index, { options: nextOptions });
                            }}
                          />
                        </div>
                      ))}
                      <Input
                        value={details.correct_answer || ''}
                        onChange={(e) => updateQuestionDetails(index, { correct_answer: e.target.value })}
                        placeholder="Correct answer text (must match one option)"
                      />
                    </div>
                  )}

                  {question.question_type === 'free_response' && (
                    <div className="space-y-1">
                      <Label>Model answer</Label>
                      <Textarea
                        rows={3}
                        value={details.answer || ''}
                        onChange={(e) => updateQuestionDetails(index, { answer: e.target.value })}
                      />
                    </div>
                  )}

                  {question.question_type === 'drag_drop' && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label>Instructions</Label>
                        <Input
                          value={details.question || ''}
                          onChange={(e) => updateQuestionDetails(index, { question: e.target.value })}
                        />
                      </div>
                      {(details.pairs || []).map((pair: Record<string, any>, pairIndex: number) => (
                        <div key={pairIndex} className="grid grid-cols-2 gap-2">
                          <Input
                            value={pair.left || ''}
                            placeholder="Left term"
                            onChange={(e) => {
                              const nextPairs = [...(details.pairs || [])];
                              nextPairs[pairIndex] = { ...nextPairs[pairIndex], left: e.target.value };
                              updateQuestionDetails(index, { pairs: nextPairs });
                            }}
                          />
                          <Input
                            value={pair.right || ''}
                            placeholder="Right match"
                            onChange={(e) => {
                              const nextPairs = [...(details.pairs || [])];
                              nextPairs[pairIndex] = { ...nextPairs[pairIndex], right: e.target.value };
                              updateQuestionDetails(index, { pairs: nextPairs });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'ged_extended_response' && (
                    <div className="space-y-1">
                      <Label>Minimum word count</Label>
                      <Input
                        type="number"
                        min={50}
                        max={1000}
                        value={details.response_fields?.[0]?.min_words ?? 200}
                        onChange={(e) =>
                          updateQuestionDetails(index, {
                            response_fields: [
                              {
                                id: 'essay',
                                label: 'Response',
                                min_words: Number(e.target.value) || 200,
                              },
                            ],
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Checkbox
                  checked={createTemplate}
                  onCheckedChange={(checked) => setCreateTemplate(!!checked)}
                />
                Also create a quiz template from selected imported questions
              </label>
              {createTemplate && (
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Quiz template name"
                />
              )}
            </div>
          </div>
        )}

        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
        {successMessage && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{successMessage}</div>}

        <div className="flex gap-2 pt-2 border-t">
          <Button onClick={handleClose} variant="outline" className="flex-1">
            {successMessage ? 'Close' : 'Cancel'}
          </Button>

          {draftQuestions.length === 0 ? (
            <Button onClick={handleParse} disabled={!hasInput || parsing} className="flex-1 gap-1.5">
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {parsing ? 'Parsing with AI...' : 'Parse Questions'}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canSave || saving} className="flex-1">
              {saving ? 'Saving...' : `Save ${includedQuestions.length} Question${includedQuestions.length === 1 ? '' : 's'}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
