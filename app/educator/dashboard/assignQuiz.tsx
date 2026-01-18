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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingQuizzes, setFetchingQuizzes] = useState(false);

  useEffect(() => {
    if (isOpen && educatorId) {
      fetchQuizzes();
    }
  }, [isOpen, educatorId]);

  const fetchQuizzes = async () => {
    setFetchingQuizzes(true);
    setError('');
    
    try {
      const response = await fetch(`/api/quiz?educatorId=${educatorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      
      const data = await response.json();
      
      // Make sure data is an array
      if (Array.isArray(data)) {
        setQuizzes(data);
      } else {
        console.error('Expected array but got:', data);
        setQuizzes([]);
        setError('No quizzes found');
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes');
      setQuizzes([]);
    } finally {
      setFetchingQuizzes(false);
    }
  };

  const handleAssign = async () => {
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
      onClose();
      setSelectedQuizId('');
      setDueDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Assigning to: <span className="font-semibold">{studentName}</span>
            </p>

            <div className="space-y-2">
              <Label>Select Quiz</Label>
              <Select 
                value={selectedQuizId} 
                onValueChange={setSelectedQuizId}
                disabled={fetchingQuizzes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={fetchingQuizzes ? "Loading quizzes..." : "-- Select a quiz --"} />
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
                        Quiz from {new Date(quiz.created_at).toLocaleDateString()} (
                        {quiz.questions?.length || 0} questions)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mt-4">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAssign}
              disabled={loading || !selectedQuizId || fetchingQuizzes}
              className="flex-1"
            >
              {loading ? 'Assigning...' : 'Assign Quiz'}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}