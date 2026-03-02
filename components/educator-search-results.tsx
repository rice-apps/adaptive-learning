'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  publication?: string;
}

interface EducatorSearchResultsProps {
  query: string;
  results: SearchResult[];
  onClose: () => void;
}

export default function EducatorSearchResults({ query, results, onClose }: EducatorSearchResultsProps) {
  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-50">
      <Card className="max-h-96 overflow-y-auto shadow-lg">
        <CardContent className="p-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="border-l-4 border-l-lime-400 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    console.log('Selected:', result);
                    onClose();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <h4 className="font-semibold">{result.title}</h4>
                      </div>
                      {result.genre && (
                        <Badge variant="outline" className="bg-lime-100 text-lime-800 border-lime-300">
                          {result.genre}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {result.author && <span>By {result.author}</span>}
                      {result.publication && <span>{result.publication}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No results found for "{query}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}