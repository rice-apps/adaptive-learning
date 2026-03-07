'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Users, CheckSquare, Square } from 'lucide-react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Template {
  id: string;
  name: string;
  question_count: number;
  subjects: string[];
}

interface AssignTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  educatorId: string;
}

interface AssignResult {
  studentId: string;
  studentName: string;
  success: boolean;
  error?: string;
}

export default function AssignTemplateModal({
  isOpen,
  onClose,
  template,
  educatorId,
}: AssignTemplateModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<AssignResult[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/educator/students');
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      // silent
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedIds.has(s.id));

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      // deselect all currently filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredStudents.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      // select all currently filtered
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredStudents.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) {
      setError('Please select at least one student.');
      return;
    }
    if (!template) return;

    setAssigning(true);
    setError('');

    const assignResults: AssignResult[] = [];

    // Assign concurrently to all selected students
    await Promise.all(
      [...selectedIds].map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        const studentName = student
          ? `${student.first_name} ${student.last_name}`
          : studentId;
        try {
          const res = await fetch('/api/quiz/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: template.id,
              studentId,
              educatorId,
              dueDate: dueDate || null,
            }),
          });
          if (!res.ok) {
            const d = await res.json();
            assignResults.push({ studentId, studentName, success: false, error: d.error });
          } else {
            assignResults.push({ studentId, studentName, success: true });
          }
        } catch (err) {
          assignResults.push({
            studentId,
            studentName,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      })
    );

    setAssigning(false);
    setResults(assignResults);
  };

  const handleClose = () => {
    setSearch('');
    setSelectedIds(new Set());
    setDueDate('');
    setError('');
    setResults(null);
    onClose();
  };

  if (!template) return null;

  const successCount = results?.filter(r => r.success).length ?? 0;
  const failCount = results?.filter(r => !r.success).length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Assign Quiz to Students</DialogTitle>
        </DialogHeader>

        {/* Quiz summary */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 shrink-0">
          <p className="font-semibold text-sm">{template.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{template.question_count} question{template.question_count !== 1 ? 's' : ''}</span>
            {template.subjects.length > 0 && (
              <>
                <span>·</span>
                <span>{template.subjects.join(', ')}</span>
              </>
            )}
          </div>
        </div>

        {results ? (
          /* ── Results view ── */
          <div className="flex-1 overflow-y-auto space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {successCount > 0 && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  ✓ {successCount} assigned successfully
                </Badge>
              )}
              {failCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  ✗ {failCount} failed
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              {results.map(r => (
                <div
                  key={r.studentId}
                  className={`flex items-center justify-between text-sm px-3 py-2 rounded ${
                    r.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <span>{r.studentName}</span>
                  {r.success ? (
                    <span className="text-xs">Assigned</span>
                  ) : (
                    <span className="text-xs">{r.error || 'Failed'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Selection view ── */
          <>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 space-y-3">
              {/* Search + select-all */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Select / deselect all filtered */}
                <button
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  onClick={toggleAll}
                  disabled={loadingStudents || filteredStudents.length === 0}
                >
                  {allFilteredSelected
                    ? <CheckSquare className="h-4 w-4" />
                    : <Square className="h-4 w-4" />}
                  {allFilteredSelected
                    ? `Deselect all${search ? ' filtered' : ''} (${filteredStudents.length})`
                    : `Select all${search ? ' filtered' : ''} (${filteredStudents.length})`}
                </button>
              </div>

              {/* Student list */}
              <div className="overflow-y-auto flex-1 border rounded-lg divide-y">
                {loadingStudents ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No students found</div>
                ) : (
                  filteredStudents.map(s => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedIds.has(s.id)}
                        onCheckedChange={() => toggleStudent(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Selected count badge */}
              {selectedIds.size > 0 && (
                <p className="text-xs text-gray-500 shrink-0">
                  {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Due date */}
            <div className="space-y-1 shrink-0">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-2 bg-red-50 text-red-700 rounded text-sm shrink-0">{error}</div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex gap-2 pt-2 border-t shrink-0">
          <Button onClick={handleClose} variant="outline" className="flex-1">
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button
              onClick={handleAssign}
              disabled={assigning || selectedIds.size === 0}
              className="flex-1"
            >
              {assigning
                ? 'Assigning...'
                : `Assign to ${selectedIds.size > 0 ? selectedIds.size : ''} Student${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
