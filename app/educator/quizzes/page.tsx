'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Pencil, Trash2, Send, BookOpen, FileQuestion, MoreHorizontal, Eye, Copy, FileUp, Sparkles, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import logo from '../../assets/logo.png';
import { createClient } from '@/lib/supabase/client';
import NotificationBell from '@/components/notifications/NotificationBell';
import AddQuestionModal, { type QuestionForEdit } from './AddQuestionModal';
import QuizBuilderModal from './QuizBuilderModal';
import AssignTemplateModal from './AssignTemplateModal';
import QuizPreviewModal from './QuizPreviewModal';
import QuizAnalyticsModal from './QuizAnalyticsModal';
import ImportQuestionsModal from './ImportQuestionsModal';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizTemplate {
  id: string;
  name: string;
  question_count: number;
  subjects: string[];
  topics: string[];
  created_at: string;
  questions: string[];
}

interface Question {
  id: string;
  subject: string | null;
  topic: string | null;
  question_type: string | null;
  question_details: Record<string, any> | null;
  created_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  free_response: 'Free Response',
  drag_drop: 'Drag & Drop',
  ged_extended_response: 'Essay',
};

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-blue-100 text-blue-700 border-blue-200',
  free_response: 'bg-green-100 text-green-700 border-green-200',
  drag_drop: 'bg-purple-100 text-purple-700 border-purple-200',
  ged_extended_response: 'bg-orange-100 text-orange-700 border-orange-200',
};

function getQuestionPreview(q: Question): string {
  const d = q.question_details;
  if (!d) return '—';
  return d.question || d.prompt || '—';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const pathname = usePathname();
  const [educatorId, setEducatorId] = useState('');

  // Quiz Templates state
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Question Bank state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [qSearch, setQSearch] = useState('');
  const [qSubject, setQSubject] = useState('all');
  const [qTopic, setQTopic] = useState('all');
  const [qType, setQType] = useState('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>([]);

  // Modals
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<QuestionForEdit | null>(null);
  const [deleteTargetQuestionId, setDeleteTargetQuestionId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<QuizTemplate | null>(null);
  const [assignTarget, setAssignTarget] = useState<QuizTemplate | null>(null);
  const [previewTarget, setPreviewTarget] = useState<QuizTemplate | null>(null);
  const [analyticsTarget, setAnalyticsTarget] = useState<QuizTemplate | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEducatorId(user.id);
    });
    fetchTemplates();
    fetchQuestions();
  }, []);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/educator/quiz-templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const res = await fetch('/api/educator/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
      setSubjects(data.subjects || []);
      setAllTopics(data.topics || []);
    } catch {
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/educator/quiz-templates/${deleteTargetId}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== deleteTargetId));
    } catch {
      // silent – could add toast
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleEditTemplate = (t: QuizTemplate) => {
    setEditTemplate(t);
    setBuilderOpen(true);
  };

  const handleDuplicateTemplate = async (t: QuizTemplate) => {
    if (!t.questions?.length) return;
    try {
      const res = await fetch('/api/educator/quiz-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Copy of ${t.name}`,
          questions: t.questions,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to duplicate');
      }
      const { template } = await res.json();
      fetchTemplates();
      setEditTemplate({
        id: template.id,
        name: template.name,
        questions: template.questions || [],
        question_count: template.questions?.length ?? 0,
        subjects: t.subjects,
        topics: t.topics,
        created_at: template.created_at ?? new Date().toISOString(),
      });
      setBuilderOpen(true);
    } catch {
      // silent – could add toast
    }
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditTemplate(null);
  };

  const handleDeleteQuestion = async () => {
    if (!deleteTargetQuestionId) return;
    try {
      await fetch(`/api/educator/questions/${deleteTargetQuestionId}`, { method: 'DELETE' });
      setQuestions(prev => prev.filter(q => q.id !== deleteTargetQuestionId));
    } catch {
      // silent
    } finally {
      setDeleteTargetQuestionId(null);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (!templateSearch) return true;
    const s = templateSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.subjects.some(sub => sub.toLowerCase().includes(s)) ||
      t.topics.some(top => top.toLowerCase().includes(s))
    );
  });

  const topicsForSubject = [
    ...new Set(
      qSubject !== 'all'
        ? questions.filter(q => q.subject === qSubject).map(q => q.topic).filter((t): t is string => !!t)
        : allTopics
    ),
  ].sort();

  const filteredQuestions = questions.filter(q => {
    if (qSubject !== 'all' && q.subject !== qSubject) return false;
    if (qTopic !== 'all' && q.topic !== qTopic) return false;
    if (qType !== 'all' && q.question_type !== qType) return false;
    if (qSearch) {
      const s = qSearch.toLowerCase();
      const preview = getQuestionPreview(q).toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      if (!preview.includes(s) && !topic.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black w-full sticky top-0 z-50 shadow-sm">
        <header className="relative w-full py-4 px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold z-10">
            <Image src={logo} alt="Logo" width={120} height={72} />
          </h1>
          <div className="flex items-center space-x-4 z-10">
            <NotificationBell />
            <Avatar className="h-14 w-14">
              <AvatarImage src="https://github.com/shadcn.png" alt="Instructor" />
              <AvatarFallback>IN</AvatarFallback>
            </Avatar>
          </div>
        </header>
      </div>

      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Nav */}
        <div className="flex gap-3">
          <Link href="/educator/dashboard">
            <Button className="rounded-md" variant={pathname === '/educator/dashboard' ? 'default' : 'outline'}>
              Cohort Overview
            </Button>
          </Link>
          <Link href="/educator/students">
            <Button className="rounded-md" variant={pathname === '/educator/students' ? 'default' : 'outline'}>
              Students
            </Button>
          </Link>
          <Link href="/educator/quizzes">
            <Button className="rounded-md" variant={pathname === '/educator/quizzes' ? 'default' : 'outline'}>
              Quizzes
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="templates" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Quiz Templates
              {templates.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{templates.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-1.5">
              <FileQuestion className="h-4 w-4" />
              Question Bank
              {questions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{questions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Quiz Templates Tab ── */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>My Quiz Templates</CardTitle>
                  <Button onClick={() => { setEditTemplate(null); setBuilderOpen(true); }} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Create Quiz
                  </Button>
                </div>
                <div className="relative max-w-sm mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search quizzes..."
                    className="pl-9"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="py-12 text-center text-gray-500">Loading...</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-gray-500">
                      {templateSearch ? 'No quizzes match your search.' : 'No quiz templates yet.'}
                    </p>
                    {!templateSearch && (
                      <Button onClick={() => setBuilderOpen(true)} variant="outline" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Create your first quiz
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTemplates.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {t.question_count} question{t.question_count !== 1 ? 's' : ''}
                            </span>
                            {t.subjects.map(s => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                            <span className="text-xs text-gray-400">{timeAgo(t.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => setAssignTarget(t)}
                            className="gap-1"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Assign
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setPreviewTarget(t)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAnalyticsTarget(t)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                See Results
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTemplate(t)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTemplate(t)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteTargetId(t.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Question Bank Tab ── */}
          <TabsContent value="bank">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle>Question Bank</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setImportModalOpen(true)}
                      variant="outline"
                      className="gap-1.5"
                      title="Upload file or paste text and let AI parse questions"
                    >
                      <FileUp className="h-4 w-4" />
                      <Sparkles className="h-3.5 w-3.5" />
                      Upload File
                    </Button>
                    <Button onClick={() => setAddQuestionOpen(true)} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Tip: Upload a worksheet or exam, review AI-parsed questions, then save only the ones you want.
                </p>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      className="pl-9 w-56"
                      value={qSearch}
                      onChange={e => setQSearch(e.target.value)}
                    />
                  </div>
                  <Select value={qSubject} onValueChange={v => { setQSubject(v); setQTopic('all'); }}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={qTopic} onValueChange={setQTopic} disabled={qSubject === 'all'}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All topics</SelectItem>
                      {topicsForSubject.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={qType} onValueChange={setQType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="free_response">Free Response</SelectItem>
                      <SelectItem value="drag_drop">Drag & Drop</SelectItem>
                      <SelectItem value="ged_extended_response">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                  {(qSubject !== 'all' || qTopic !== 'all' || qType !== 'all' || qSearch) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setQSubject('all'); setQTopic('all'); setQType('all'); setQSearch(''); }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {questionsLoading ? (
                  <div className="py-12 text-center text-gray-500">Loading...</div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-gray-500">
                      {qSearch || qSubject !== 'all' || qType !== 'all'
                        ? 'No questions match your filters.'
                        : 'No questions in the bank yet.'}
                    </p>
                    {!qSearch && qSubject === 'all' && qType === 'all' && (
                      <Button onClick={() => setAddQuestionOpen(true)} variant="outline" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Add your first question
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                          <th className="pb-2 pr-4 font-medium w-24">Type</th>
                          <th className="pb-2 pr-4 font-medium w-36">Subject</th>
                          <th className="pb-2 pr-4 font-medium w-48">Topic</th>
                          <th className="pb-2 font-medium">Question Preview</th>
                          <th className="pb-2 w-20 text-right font-medium">Added</th>
                          <th className="pb-2 w-20 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuestions.map(q => (
                          <tr key={q.id} className="border-b last:border-b-0 hover:bg-gray-50 group">
                            <td className="py-3 pr-4">
                              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[q.question_type || ''] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {TYPE_LABELS[q.question_type || ''] || q.question_type || '—'}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-600">{q.subject || '—'}</td>
                            <td className="py-3 pr-4 text-xs text-gray-600 max-w-[12rem]">
                              <span className="truncate block">{q.topic || '—'}</span>
                            </td>
                            <td className="py-3 text-xs text-gray-800 max-w-xs">
                              <p className="line-clamp-2">{getQuestionPreview(q)}</p>
                            </td>
                            <td className="py-3 text-xs text-gray-400 text-right whitespace-nowrap">
                              {q.created_at ? timeAgo(q.created_at) : '—'}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditQuestion(q)}
                                  title="Edit question"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteTargetQuestionId(q.id)}
                                  title="Delete question"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-3 text-right">
                      Showing {filteredQuestions.length} of {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <AddQuestionModal
        isOpen={addQuestionOpen || !!editQuestion}
        onClose={() => { setAddQuestionOpen(false); setEditQuestion(null); }}
        onSaved={() => { setAddQuestionOpen(false); setEditQuestion(null); fetchQuestions(); }}
        editQuestion={editQuestion}
      />

      <ImportQuestionsModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSaved={() => {
          fetchQuestions();
          fetchTemplates();
        }}
      />

      <QuizBuilderModal
        isOpen={builderOpen}
        onClose={handleBuilderClose}
        onSaved={() => { handleBuilderClose(); fetchTemplates(); }}
        editTemplate={editTemplate}
      />

      <AssignTemplateModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        template={assignTarget}
        educatorId={educatorId}
      />

      <QuizPreviewModal
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        template={previewTarget}
      />

      <QuizAnalyticsModal
        isOpen={!!analyticsTarget}
        onClose={() => setAnalyticsTarget(null)}
        template={analyticsTarget}
      />

      {/* Delete quiz template confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={open => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the template. Any quizzes already assigned to students will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteTemplate}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete question confirmation */}
      <AlertDialog open={!!deleteTargetQuestionId} onOpenChange={open => !open && setDeleteTargetQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the question from the bank. Any quizzes that already include it will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteQuestion}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
