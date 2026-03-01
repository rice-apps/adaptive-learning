'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

const SUBJECTS = ['Math', 'Science', 'Social Studies', 'Reading/Language Arts'];

const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  'Math': [
    'Number operations & number sense',
    'Fractions, decimals, ratios, and proportions',
    'Percents and rates',
    'Measurement & geometry (area, volume, perimeter)',
    'Expressions, equations, and inequalities',
    'Linear functions & graphing',
    'Polynomials & factoring',
    'Word problems and real-world applications',
  ],
  'Science': [
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

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'free_response', label: 'Free Response' },
  { value: 'drag_drop', label: 'Drag & Drop (Matching)' },
  { value: 'ged_extended_response', label: 'Extended Response (Essay)' },
];

interface DragDropPair { left: string; right: string; }

export interface QuestionForEdit {
  id: string;
  subject: string | null;
  topic: string | null;
  question_type: string | null;
  question_details: Record<string, any> | null;
}

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editQuestion?: QuestionForEdit | null;
}

const DEFAULT_PAIRS: DragDropPair[] = [
  { left: '', right: '' },
  { left: '', right: '' },
  { left: '', right: '' },
];

export default function AddQuestionModal({
  isOpen,
  onClose,
  onSaved,
  editQuestion,
}: AddQuestionModalProps) {
  const isEditing = !!editQuestion;

  const [step, setStep] = useState<1 | 2>(1);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // MCQ
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqPassage, setMcqPassage] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrect, setMcqCorrect] = useState('');
  const [mcqExplanation, setMcqExplanation] = useState('');

  // Free response
  const [frQuestion, setFrQuestion] = useState('');
  const [frPassage, setFrPassage] = useState('');
  const [frAnswer, setFrAnswer] = useState('');

  // Drag & drop
  const [ddQuestion, setDdQuestion] = useState('');
  const [ddPairs, setDdPairs] = useState<DragDropPair[]>(DEFAULT_PAIRS);

  // Extended response
  const [erQuestion, setErQuestion] = useState('');
  const [erPassage, setErPassage] = useState('');
  const [erMinWords, setErMinWords] = useState(200);

  // When opening for edit, pre-populate all fields and skip to step 2
  useEffect(() => {
    if (isOpen && editQuestion) {
      const d = editQuestion.question_details || {};
      setSubject(editQuestion.subject || '');
      setTopic(editQuestion.topic || '');
      setQuestionType(editQuestion.question_type || '');

      switch (editQuestion.question_type) {
        case 'mcq':
          setMcqQuestion(d.question || '');
          setMcqPassage(d.passage || '');
          setMcqOptions(Array.isArray(d.options) && d.options.length === 4 ? d.options : ['', '', '', '']);
          setMcqCorrect(d.correct_answer || '');
          setMcqExplanation(d.explanation || '');
          break;
        case 'free_response':
          setFrQuestion(d.question || '');
          setFrPassage(d.passage || '');
          setFrAnswer(d.answer || '');
          break;
        case 'drag_drop':
          setDdQuestion(d.question || '');
          setDdPairs(Array.isArray(d.pairs) && d.pairs.length >= 2 ? d.pairs : DEFAULT_PAIRS);
          break;
        case 'ged_extended_response':
          setErQuestion(d.question || '');
          setErPassage(d.passage || '');
          setErMinWords(d.response_fields?.[0]?.min_words ?? 200);
          break;
      }
      setStep(2);
    } else if (isOpen && !editQuestion) {
      handleReset();
    }
  }, [isOpen, editQuestion]);

  const handleReset = () => {
    setStep(1);
    setSubject(''); setTopic(''); setQuestionType('');
    setMcqQuestion(''); setMcqPassage(''); setMcqOptions(['', '', '', '']); setMcqCorrect(''); setMcqExplanation('');
    setFrQuestion(''); setFrPassage(''); setFrAnswer('');
    setDdQuestion(''); setDdPairs(DEFAULT_PAIRS);
    setErQuestion(''); setErPassage(''); setErMinWords(200);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateStep1 = () => subject && topic && questionType;

  const buildQuestionDetails = () => {
    switch (questionType) {
      case 'mcq': {
        const d: Record<string, any> = { question: mcqQuestion, options: mcqOptions, correct_answer: mcqCorrect };
        if (mcqPassage) d.passage = mcqPassage;
        if (mcqExplanation) d.explanation = mcqExplanation;
        return d;
      }
      case 'free_response': {
        const d: Record<string, any> = { question: frQuestion, answer: frAnswer };
        if (frPassage) d.passage = frPassage;
        return d;
      }
      case 'drag_drop':
        return { question: ddQuestion, pairs: ddPairs.filter(p => p.left && p.right) };
      case 'ged_extended_response': {
        const d: Record<string, any> = {
          question: erQuestion,
          response_fields: [{ id: 'essay', label: 'Response', min_words: erMinWords }],
        };
        if (erPassage) d.passage = erPassage;
        return d;
      }
      default:
        return {};
    }
  };

  const validateStep2 = () => {
    switch (questionType) {
      case 'mcq':
        return mcqQuestion.trim() && mcqOptions.every(o => o.trim()) && mcqCorrect;
      case 'free_response':
        return frQuestion.trim() && frAnswer.trim();
      case 'drag_drop':
        return ddQuestion.trim() && ddPairs.filter(p => p.left && p.right).length >= 2;
      case 'ged_extended_response':
        return erQuestion.trim();
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!validateStep2()) { setError('Please fill in all required fields.'); return; }
    setSaving(true);
    setError('');
    try {
      const url = isEditing
        ? `/api/educator/questions/${editQuestion!.id}`
        : '/api/educator/questions';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          question_type: questionType,
          question_details: buildQuestionDetails(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save question');
      }
      handleReset();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];
  // Deduplicate topics to prevent React key warnings
  const availableTopics = [...new Set(TOPICS_BY_SUBJECT[subject] || [])];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Question' : 'Add Question to Question Bank'}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Badge variant={step === 1 ? 'default' : 'secondary'}>1. Type & Topic</Badge>
          <Badge variant={step === 2 ? 'default' : 'secondary'}>2. Question Details</Badge>
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Select value={subject} onValueChange={(v) => { setSubject(v); setTopic(''); }}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic <span className="text-red-500">*</span></Label>
              <Select value={topic} onValueChange={setTopic} disabled={!subject}>
                <SelectTrigger><SelectValue placeholder={subject ? 'Select topic' : 'Select subject first'} /></SelectTrigger>
                <SelectContent>
                  {availableTopics.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Question Type <span className="text-red-500">*</span></Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger><SelectValue placeholder="Select question type" /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleClose} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!validateStep1()} className="flex-1">
                Next: Enter Question
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded px-3 py-2">
              <span>{subject}</span>
              <span>·</span>
              <span>{topic}</span>
              <span>·</span>
              <span className="font-medium">{QUESTION_TYPES.find(t => t.value === questionType)?.label}</span>
            </div>

            {/* MCQ */}
            {questionType === 'mcq' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reading Passage (optional)</Label>
                  <Textarea placeholder="Paste any reading passage or context here..." value={mcqPassage} onChange={e => setMcqPassage(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Question Text <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Enter the question..." value={mcqQuestion} onChange={e => setMcqQuestion(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Answer Options <span className="text-red-500">*</span></Label>
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-6 text-center">{optionLabels[i]}</span>
                      <Input
                        placeholder={`Option ${optionLabels[i]}`}
                        value={opt}
                        onChange={e => {
                          const next = [...mcqOptions];
                          next[i] = e.target.value;
                          setMcqOptions(next);
                        }}
                      />
                      <input
                        type="radio"
                        name="correct"
                        checked={mcqCorrect === opt && opt !== ''}
                        onChange={() => setMcqCorrect(opt)}
                        className="h-4 w-4 cursor-pointer"
                        title="Mark as correct answer"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">Click the radio button next to the correct answer.</p>
                </div>
                <div className="space-y-2">
                  <Label>Explanation (optional)</Label>
                  <Textarea placeholder="Explain why the correct answer is correct..." value={mcqExplanation} onChange={e => setMcqExplanation(e.target.value)} rows={2} />
                </div>
              </div>
            )}

            {/* Free Response */}
            {questionType === 'free_response' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reading Passage (optional)</Label>
                  <Textarea placeholder="Paste any reading passage or context here..." value={frPassage} onChange={e => setFrPassage(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Question Text <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Enter the question..." value={frQuestion} onChange={e => setFrQuestion(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Model Answer <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Enter the expected answer (used for AI feedback comparison)..." value={frAnswer} onChange={e => setFrAnswer(e.target.value)} rows={3} />
                </div>
              </div>
            )}

            {/* Drag & Drop */}
            {questionType === 'drag_drop' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Instructions <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Match each term with its definition" value={ddQuestion} onChange={e => setDdQuestion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Matching Pairs <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2 text-sm font-medium text-gray-600 px-1">
                    <span>Left (Term)</span>
                    <span>Right (Match)</span>
                  </div>
                  {ddPairs.map((pair, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input placeholder="Term" value={pair.left} onChange={e => { const n = [...ddPairs]; n[i] = { ...pair, left: e.target.value }; setDdPairs(n); }} />
                      <span className="text-gray-400">↔</span>
                      <Input placeholder="Definition / Match" value={pair.right} onChange={e => { const n = [...ddPairs]; n[i] = { ...pair, right: e.target.value }; setDdPairs(n); }} />
                      {ddPairs.length > 2 && (
                        <Button size="icon" variant="ghost" onClick={() => setDdPairs(ddPairs.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setDdPairs([...ddPairs, { left: '', right: '' }])} className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add Pair
                  </Button>
                </div>
              </div>
            )}

            {/* Extended Response */}
            {questionType === 'ged_extended_response' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Stimulus / Reading Passage (optional)</Label>
                  <Textarea placeholder="Paste any reading passages or source material here..." value={erPassage} onChange={e => setErPassage(e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Essay Prompt <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Enter the essay question or prompt..." value={erQuestion} onChange={e => setErQuestion(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Word Count</Label>
                  <Input type="number" min={50} max={1000} value={erMinWords} onChange={e => setErMinWords(parseInt(e.target.value) || 200)} />
                </div>
              </div>
            )}

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

            <div className="flex gap-2 pt-2">
              {!isEditing && (
                <Button onClick={() => { setStep(1); setError(''); }} variant="outline" className="flex-1">
                  Back
                </Button>
              )}
              {isEditing && (
                <Button onClick={handleClose} variant="outline" className="flex-1">Cancel</Button>
              )}
              <Button onClick={handleSave} disabled={saving || !validateStep2()} className="flex-1">
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save to Question Bank'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
