'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

interface Quiz {
  id: string;
  created_at: string;
  questions: string[];
}

interface AssignQuizDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  educatorId: string;
}

export default function AssignQuizDialog({
  isOpen,
  onClose,
  studentId,
  studentName,
  educatorId,
}: AssignQuizDialogProps) {
  // Existing quiz states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingQuizzes, setFetchingQuizzes] = useState(false);

  // AI generation states
  const [aiTotalQuestions, setAiTotalQuestions] = useState(10);
  const [aiFocusAreas, setAiFocusAreas] = useState<string[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  const availableFocusAreas = ['Math', 'Science', 'Social Studies', 'Reading/Language Arts'];

  useEffect(() => {
    if (isOpen && educatorId) {
      fetchQuizzes();
    }
  }, [isOpen, educatorId]);

  const fetchQuizzes = async () => {
    setFetchingQuizzes(true);
    setError('');
    
    try {
      const response = await fetch(`/api/quiz?educatorId=${educatorId}&includeTemplates=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const data = await response.json();

      
      if (Array.isArray(data)) {
        // Dedupe by questions signature so "template-like" quizzes appear once
        const bySig = new Map<string, Quiz>();
        for (const q of data as Quiz[]) {
          const sig = Array.isArray(q.questions) ? q.questions.join(",") : "";
          const prev = bySig.get(sig);
          // keep most recent as representative
          if (!prev || new Date(q.created_at).getTime() > new Date(prev.created_at).getTime()) {
            bySig.set(sig, q);
          }
        }
        setQuizzes(Array.from(bySig.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } else {
        setQuizzes([]);
      }
    } catch (err) {
      setError('Failed to load quizzes');
      setQuizzes([]);
    } finally {
      setFetchingQuizzes(false);
    }
  };

  const handleAssignExisting = async () => {
    if (!selectedQuizId) {
      setError('Please select a quiz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/quiz/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuizId,
          studentId,
          educatorId,
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign quiz');
      }

      alert(`Quiz assigned to ${studentName} successfully!`);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (aiTotalQuestions === 0) {
      setError('Please specify number of questions');
      return;
    }

    setAiGenerating(true);
    setError('');

    try {
      const distributionResponse = await fetch('/api/quiz/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          educatorId,
          totalQuestions: aiTotalQuestions,
          focusAreas: aiFocusAreas.length > 0 ? aiFocusAreas : undefined,
        }),
      });

      if (!distributionResponse.ok) {
        const errorData = await distributionResponse.json();
        throw new Error(errorData.error || 'Failed to generate intelligent quiz');
      }

      const data = await distributionResponse.json();

      if (dueDate && data.quiz?.id) {
        await addDeadline(data.quiz.id);
      }

      alert(
        `AI-generated quiz assigned to ${studentName}!\n\n` +
        `Topics: ${Object.entries(data.topicDistribution).map(([topic, count]) => `${topic}: ${count}`).join(', ')}\n\n` +
        `Reasoning: ${data.reasoning}`
      );
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI quiz');
    } finally {
      setAiGenerating(false);
    }
  };

  const addDeadline = async (quizId: string) => {
    try {
      await fetch('/api/quiz/deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          studentId,
          educatorId,
          dueDate,
        }),
      });
    } catch (err) {
      // Silently fail - deadline is optional
    }
  };

  const resetForm = () => {
    setSelectedQuizId('');
    setDueDate('');
    setAiTotalQuestions(10);
    setAiFocusAreas([]);
    setError('');
  };

  const toggleFocusArea = (area: string) => {
    setAiFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Quiz to {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">AI Generate</TabsTrigger>
              <TabsTrigger value="existing">Existing</TabsTrigger>
            </TabsList>

            {/* AI-Generated Quiz Tab */}
            <TabsContent value="ai" className="space-y-4 mt-4">
              
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={aiTotalQuestions}
                  onChange={(e) => setAiTotalQuestions(parseInt(e.target.value) || 10)}
                />
              </div>

              <div className="space-y-2">
                <Label>Focus Areas (Optional)</Label>
                <div className="space-y-2">
                  {availableFocusAreas.map(area => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={area}
                        checked={aiFocusAreas.includes(area)}
                        onCheckedChange={() => toggleFocusArea(area)}
                      />
                      <label
                        htmlFor={area}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for Mastra to decide based on student needs
                </p>
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerateAI}
                disabled={aiGenerating || aiTotalQuestions === 0}
                className="w-full"
              >
                {aiGenerating ? 'AI Generating...' : `Generate Smart Quiz (${aiTotalQuestions} questions)`}
              </Button>
            </TabsContent>

            {/* Assign Existing Quiz Tab */}
            <TabsContent value="existing" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Quiz</Label>
                <Select 
                  value={selectedQuizId} 
                  onValueChange={setSelectedQuizId}
                  disabled={fetchingQuizzes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={fetchingQuizzes ? "Loading..." : "-- Select a quiz --"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fetchingQuizzes ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : quizzes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No quizzes available
                      </SelectItem>
                    ) : (
                      quizzes.map((quiz) => (
                        <SelectItem key={quiz.id} value={quiz.id}>
                          Quiz from {new Date(quiz.created_at).toLocaleDateString()} ({quiz.questions?.length || 0} questions)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleAssignExisting}
                disabled={loading || !selectedQuizId || fetchingQuizzes}
                className="w-full"
              >
                {loading ? 'Assigning...' : 'Assign Existing Quiz'}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button onClick={onClose} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}