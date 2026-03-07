'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Search, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface Question {
  id: string;
  subject: string | null;
  topic: string | null;
  question_type: string | null;
  question_details: Record<string, any> | null;
  created_at: string | null;
}

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTemplate?: {
    id: string;
    name: string;
    questions: string[];
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  free_response: 'Free Response',
  drag_drop: 'Drag & Drop',
  ged_extended_response: 'Essay',
};

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-blue-100 text-blue-700',
  free_response: 'bg-green-100 text-green-700',
  drag_drop: 'bg-purple-100 text-purple-700',
  ged_extended_response: 'bg-orange-100 text-orange-700',
};

function getQuestionPreview(q: Question): string {
  const details = q.question_details;
  if (!details) return 'No preview available';
  return details.question || details.prompt || 'No question text';
}

export default function QuizBuilderModal({
  isOpen,
  onClose,
  onSaved,
  editTemplate,
}: QuizBuilderModalProps) {
  const [quizName, setQuizName] = useState('');
  const [description, setDescription] = useState('');

  // Bank state
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  // Selected questions (ordered)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBank();
      if (editTemplate) {
        setQuizName(editTemplate.name);
        setSelectedIds(editTemplate.questions || []);
      }
    }
  }, [isOpen, editTemplate]);

  const fetchBank = async () => {
    setBankLoading(true);
    try {
      const res = await fetch('/api/educator/questions');
      const data = await res.json();
      setBankQuestions(data.questions || []);
      setSubjects(data.subjects || []);
      setAllTopics(data.topics || []);
    } catch {
      // silent
    } finally {
      setBankLoading(false);
    }
  };

  const filteredBank = bankQuestions.filter(q => {
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    if (filterTopic !== 'all' && q.topic !== filterTopic) return false;
    if (filterType !== 'all' && q.question_type !== filterType) return false;
    if (bankSearch) {
      const preview = getQuestionPreview(q).toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const subject = (q.subject || '').toLowerCase();
      const s = bankSearch.toLowerCase();
      if (!preview.includes(s) && !topic.includes(s) && !subject.includes(s)) return false;
    }
    return true;
  });

  const topicsForSubject = filterSubject !== 'all'
    ? bankQuestions
        .filter(q => q.subject === filterSubject)
        .map(q => q.topic)
        .filter((t): t is string => !!t)
        .filter((t, i, arr) => arr.indexOf(t) === i)
        .sort()
    : allTopics;

  const selectedQuestions = selectedIds
    .map(id => bankQuestions.find(q => q.id === id))
    .filter((q): q is Question => !!q);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const removeSelected = (id: string) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...selectedIds];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setSelectedIds(next);
  };

  const moveDown = (idx: number) => {
    if (idx === selectedIds.length - 1) return;
    const next = [...selectedIds];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setSelectedIds(next);
  };

  const handleClose = () => {
    setQuizName('');
    setDescription('');
    setSelectedIds([]);
    setBankSearch('');
    setFilterSubject('all');
    setFilterTopic('all');
    setFilterType('all');
    setError('');
    onClose();
  };

  const handleSave = async () => {
    if (!quizName.trim()) {
      setError('Please give your quiz a name.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please add at least one question to the quiz.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editTemplate
        ? `/api/educator/quiz-templates/${editTemplate.id}`
        : '/api/educator/quiz-templates';
      const method = editTemplate ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: quizName.trim(), questions: selectedIds }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save quiz');
      }
      handleClose();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const subjectCoverage = [...new Set(selectedQuestions.map(q => q.subject).filter(Boolean))];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editTemplate ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
        </DialogHeader>

        {/* Quiz name + description */}
        <div className="grid grid-cols-2 gap-4 pb-3 border-b">
          <div className="space-y-1">
            <Label>Quiz Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Fractions & Ratios Review"
              value={quizName}
              onChange={e => setQuizName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description of this quiz..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
          {/* Left: Question Bank browser */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden border rounded-lg">
            <div className="p-3 border-b bg-gray-50">
              <p className="text-sm font-semibold mb-2">Question Bank</p>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search questions..."
                  className="pl-8 h-8 text-sm"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterSubject} onValueChange={v => { setFilterSubject(v); setFilterTopic('all'); }}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="free_response">Free Response</SelectItem>
                    <SelectItem value="drag_drop">Drag & Drop</SelectItem>
                    <SelectItem value="ged_extended_response">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {bankLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading questions...</div>
              ) : filteredBank.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No questions found</div>
              ) : (
                filteredBank.map(q => {
                  const selected = selectedIds.includes(q.id);
                  const expanded = expandedPreview === q.id;
                  const preview = getQuestionPreview(q);
                  return (
                    <div
                      key={q.id}
                      className={`border-b last:border-b-0 px-3 py-2 ${selected ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[q.question_type || ''] || 'bg-gray-100 text-gray-600'}`}>
                              {TYPE_LABELS[q.question_type || ''] || q.question_type}
                            </span>
                            <span className="text-xs text-gray-400 truncate">{q.subject} · {q.topic}</span>
                          </div>
                          <p className={`text-sm text-gray-800 ${expanded ? '' : 'line-clamp-2'}`}>
                            {preview}
                          </p>
                          {preview.length > 100 && (
                            <button
                              className="text-xs text-blue-500 hover:underline mt-0.5"
                              onClick={() => setExpandedPreview(expanded ? null : q.id)}
                            >
                              {expanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          className="shrink-0 h-7 text-xs"
                          onClick={() => toggleSelect(q.id)}
                        >
                          {selected ? <><X className="h-3 w-3 mr-1" />Remove</> : <><Plus className="h-3 w-3 mr-1" />Add</>}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Quiz composition */}
          <div className="w-80 shrink-0 flex flex-col border rounded-lg">
            <div className="p-3 border-b bg-gray-50">
              <p className="text-sm font-semibold">Quiz ({selectedIds.length} questions)</p>
              {subjectCoverage.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{subjectCoverage.join(', ')}</p>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {selectedIds.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  Add questions from the bank on the left
                </div>
              ) : (
                selectedQuestions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-1 px-2 py-2 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === selectedIds.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 w-4 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs px-1 py-0.5 rounded ${TYPE_COLORS[q.question_type || ''] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[q.question_type || ''] || q.question_type}
                      </span>
                      <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">{getQuestionPreview(q)}</p>
                    </div>
                    <button
                      onClick={() => removeSelected(q.id)}
                      className="text-gray-300 hover:text-red-400 shrink-0 pt-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button onClick={handleClose} variant="outline" className="flex-1">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !quizName.trim() || selectedIds.length === 0}
            className="flex-1"
          >
            {saving ? 'Saving...' : editTemplate ? 'Save Changes' : `Save Quiz (${selectedIds.length} questions)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
