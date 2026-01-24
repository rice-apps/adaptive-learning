"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PromptDiagnosticCard() {
  const router = useRouter();

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center text-center space-y-4 bg-white">
      <h3 className="text-2xl font-bold text-gray-900">Start Your Diagnostic Assessment</h3>
      <p className="text-gray-500 max-w-lg">
        Complete this one-time quiz to unlock lessons, feedback, and progress tracking.
      </p>
      <Button 
        onClick={() => router.push('/student/diagnostic')} 
        className="bg-black text-white px-10 py-6 rounded-xl font-bold hover:bg-zinc-800 transition-all mt-2"
      >
        Start Quiz
      </Button>
    </div>
  );
}