'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { timeAgo } from '@/lib/utils/timeAgo';
import { Badge } from '@/components/ui/badge';

interface QuizCompletionCardProps {
  quiz: {
    id: string;
    start_time: string | null;
    end_time: string | null;
    time_spent: string | null;
    submitted: string | null;
  };
}

export default function QuizCompletionCard({ quiz }: QuizCompletionCardProps) {
  const [submittedAgo, setSubmittedAgo] = useState(timeAgo(quiz.submitted));

  // Update "time ago" every minute for dynamic updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSubmittedAgo(timeAgo(quiz.submitted));
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [quiz.submitted]);

  return (
    <Card className="border-l-4 border-l-lime-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="bg-lime-100 text-lime-800 border-lime-300">
            Quiz Completed
          </Badge>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {submittedAgo}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600">Time spent:</span>
          <span className="text-sm font-medium flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {quiz.time_spent || 'N/A'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}