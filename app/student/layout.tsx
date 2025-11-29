'use client';

import { useTimeTracking } from '@/hooks/useTimeTracking';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Start tracking time for all student pages
  useTimeTracking();

  return (
    <div className="min-h-screen">
      {/* Your existing layout */}
      {children}
    </div>
  );
}