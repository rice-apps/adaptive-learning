"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type StimulusDocument = {
  id: string;
  title: string;
  intro: string | null;
  time_limit_minutes: number | null;
  references: any | null;
  source_pdf_storage_path: string | null;
};

type StimulusSource = {
  id: string;
  document_id: string;
  sort_order: number;
  label: string | null;
  genre: string | null;
  title: string | null;
  author: string | null;
  publication: string | null;
  body_markdown: string;
};

export default function TakeQuizPage() {
  const router = useRouter();
  const { quizId } = useParams();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [stimulusByDocId, setStimulusByDocId] = useState<
    Record<string, { document: StimulusDocument; sources: StimulusSource[] }>
  >({});
  const [leftPaneWidthPx, setLeftPaneWidthPx] = useState<number>(520);
  const [isResizing, setIsResizing] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);
  const timeoutSubmitOnceRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fetchQuizData = async () => {
      const supabase = createClient();
      const { data: quiz } = await supabase.from("Quizzes").select("*").eq("id", quizId).single();
      
      if (quiz?.questions) {
        const { data: qs } = await supabase.from("Questions").select("*").in("id", quiz.questions);
        const sorted = quiz.questions.map((id: string) => qs?.find((q: any) => q.id === id)).filter(Boolean);
        setQuestions(sorted);
      }
      setIsLoading(false);
    };
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("gedStimulusLeftPaneWidthPx") : null;
    if (saved) {
      const n = Number(saved);
      if (Number.isFinite(n) && n >= 360 && n <= 820) setLeftPaneWidthPx(n);
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      const min = 360;
      const max = 820;
      const next = Math.max(min, Math.min(max, e.clientX - 24)); // account for page padding
      setLeftPaneWidthPx(next);
    };
    const onUp = () => {
      setIsResizing(false);
      try {
        window.localStorage.setItem("gedStimulusLeftPaneWidthPx", String(leftPaneWidthPx));
      } catch {
        // ignore
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, leftPaneWidthPx]);

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const parseDetails = (q: any) => {
    if (!q) return null;
    return typeof q.question_details === "string" ? JSON.parse(q.question_details) : q.question_details;
  };

  const computeCorrectness = (q: any, details: any, answer: any): boolean | null => {
    if (!q) return null;
    if (q.question_type === "ged_extended_response") return null;
    if (!details) return null;

    if (q.question_type === "drag_drop") {
      const correctAnswers = (details.qa_pairs || []).map((p: any) => p.answer);
      if (!Array.isArray(answer) || answer.length !== correctAnswers.length) return false;
      return answer.every((a, i) => a === correctAnswers[i]);
    }

    // mcq / free_response (and other scalar types)
    return String(answer) === String(details.answer);
  };

  const ensureStimulusLoaded = async (stimulusDocumentId: string) => {
    if (!stimulusDocumentId) return;
    if (stimulusByDocId[stimulusDocumentId]) return;

    const supabase = createClient();
    const { data: doc, error: docError } = await supabase
      .from("question_stimulus_documents")
      .select("*")
      .eq("id", stimulusDocumentId)
      .single();

    if (docError || !doc) {
      console.error("Failed to fetch stimulus document:", docError);
      toast.error("Failed to load reading materials");
      return;
    }

    const { data: sources, error: srcError } = await supabase
      .from("question_stimulus_sources")
      .select("*")
      .eq("document_id", stimulusDocumentId)
      .order("sort_order", { ascending: true });

    if (srcError) {
      console.error("Failed to fetch stimulus sources:", srcError);
      toast.error("Failed to load reading materials");
      return;
    }

    setStimulusByDocId((prev) => ({
      ...prev,
      [stimulusDocumentId]: {
        document: doc as StimulusDocument,
        sources: (sources as StimulusSource[]) || [],
      },
    }));
  };

  useEffect(() => {
    if (!currentQ) return;
    if (currentQ.question_type !== "ged_extended_response") return;
    const details = parseDetails(currentQ);
    const stimulusDocumentId = details?.stimulus_document_id;
    if (!stimulusDocumentId) return;
    ensureStimulusLoaded(stimulusDocumentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ?.id]);

  const gedTimerKey = useMemo(() => {
    if (!currentQ || !quizId) return null;
    if (currentQ.question_type !== "ged_extended_response") return null;
    return `gedErDeadline:${String(quizId)}:${String(currentQ.id)}`;
  }, [currentQ, quizId]);

  const forceSubmitDueToTimeout = async () => {
    if (!currentQ) return;
    const key = String(currentQ.id);
    if (timeoutSubmitOnceRef.current[key]) return;
    timeoutSubmitOnceRef.current[key] = true;

    toast.error("Time’s up — submitting your response.");

    // Submit whatever we have without enforcing min word count.
    await handleNext({ force: true, reason: "timeout" });
  };

  // Countdown timer for GED extended response
  useEffect(() => {
    if (!currentQ || currentQ.question_type !== "ged_extended_response") {
      setTimeLeftSec(null);
      return;
    }

    const details = parseDetails(currentQ);
    const stimulusDocumentId = details?.stimulus_document_id;
    const stimulus = stimulusDocumentId ? stimulusByDocId[stimulusDocumentId] : null;
    const minutes =
      Number(stimulus?.document?.time_limit_minutes) ||
      Number(details?.time_limit_minutes) ||
      45;

    if (!gedTimerKey) return;

    let deadlineMs: number | null = null;
    try {
      const existing = window.localStorage.getItem(gedTimerKey);
      if (existing) {
        const n = Number(existing);
        if (Number.isFinite(n) && n > 0) deadlineMs = n;
      }
      if (!deadlineMs) {
        deadlineMs = Date.now() + minutes * 60 * 1000;
        window.localStorage.setItem(gedTimerKey, String(deadlineMs));
      }
    } catch {
      // If localStorage fails, fall back to in-memory deadline.
      deadlineMs = Date.now() + minutes * 60 * 1000;
    }

    const tick = () => {
      if (!deadlineMs) return;
      const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setTimeLeftSec(diff);
      if (diff <= 0 && !isSubmitting && !showFeedback && !isFinishing) {
        forceSubmitDueToTimeout();
      }
    };

    // Reset per question
    timeoutSubmitOnceRef.current[String(currentQ.id)] = false;
    tick();

    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ?.id, stimulusByDocId, gedTimerKey, isSubmitting, showFeedback, isFinishing]);

  const validateAnswer = (q: any, details: any, answer: any): boolean => {
    if (!q) return false;

    if (q.question_type === "ged_extended_response") {
      const essay = typeof answer === "object" && answer ? String(answer.essay || "") : "";
      const minWords =
        details?.response_fields?.find((f: any) => f.id === "essay")?.min_words ??
        details?.response_fields?.[0]?.min_words ??
        null;

      if (!essay.trim()) {
        toast.error("Please write your response before continuing");
        return false;
      }
      if (typeof minWords === "number") {
        const wc = essay.trim().split(/\s+/).filter(Boolean).length;
        if (wc < minWords) {
          toast.error(`Please write at least ${minWords} words (currently ${wc})`);
          return false;
        }
      }
      return true;
    }

    if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === "") {
      toast.error("Please answer the question before continuing");
      return false;
    }

    if (q.question_type === "drag_drop") {
      const expected = (details?.qa_pairs || []).length;
      if (!Array.isArray(answer) || answer.length !== expected || answer.some((a) => !a || String(a).trim() === "")) {
        toast.error("Please answer all items before continuing");
        return false;
      }
    }

    return true;
  };

  const handleNext = async (opts?: { force?: boolean; reason?: "timeout" | "user" }) => {
    if (!currentQ) return;

    const answer = answers[currentQ.id];
    const questionDetails = parseDetails(currentQ);
    const force = Boolean(opts?.force);
    if (!force && !validateAnswer(currentQ, questionDetails, answer)) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to continue');
        setIsSubmitting(false);
        return;
      }

      const correct = computeCorrectness(currentQ, questionDetails, answer);
      setIsCorrect(correct);

      const insertPayload: Record<string, any> = {
        quiz_id: quizId,
        question_id: currentQ.id,
        student_id: user.id,
      };

      if (currentQ.question_type === "ged_extended_response") {
        const essay = typeof answer === "object" && answer ? String(answer.essay || "") : "";
        insertPayload.student_answer = essay; // keep for simple display
        insertPayload.student_answer_json = { essay };
      } else if (typeof answer === "string") {
        insertPayload.student_answer = answer;
      } else {
        // arrays / objects (e.g., drag_drop)
        insertPayload.student_answer = JSON.stringify(answer);
        insertPayload.student_answer_json = answer;
      }

      const { data: resultData, error: insertError } = await supabase
        .from('Results')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !resultData) {
        console.error('Error saving result:', insertError);
        toast.error(`Failed to save answer: ${insertError?.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }

      const feedbackInput =
        currentQ.question_type === "ged_extended_response"
          ? { ...(insertPayload.student_answer_json || {}), essay: insertPayload.student_answer }
          : answer;

      const feedback = await generateFeedback(resultData.id, currentQ.id, user.id, feedbackInput);
      
      if (feedback) {
        setCurrentFeedback(feedback);
        setShowFeedback(true);
      } else {
        toast.error('Could not generate feedback, but answer was saved');
        proceedToNext();
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateFeedback = async (
    resultId: string,
    questionId: string,
    studentId: string,
    studentAnswer: any
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/quiz/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId,
          questionId,
          studentId,
          studentAnswer,
        }),
      });
  
      const result = await response.json();
  
      if (result.success && result.feedback) {
        return result.feedback;
      }
  
      return null;
    } catch (error) {
      console.error('Error generating feedback:', error);
      return null;
    }
  };

  const proceedToNext = () => {
    setShowFeedback(false);
    setCurrentFeedback("");
    setIsCorrect(null);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinishing(true);
    try {
      const supabase = createClient();
      
      // Mark the quiz as submitted
      await supabase
        .from("Quizzes")
        .update({ 
          submitted: true, 
          end_time: new Date().toISOString() 
        })
        .eq("id", quizId);

      // Generate the quiz summary from all the per-question feedback
      const summaryRes = await fetch('/api/quiz/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      });

      if (!summaryRes.ok) {
        console.error('Summary generation failed:', await summaryRes.json());
      }

      toast.success("Quiz submitted successfully!");
      router.push("/student/dashboard");
    } catch (error) {
      console.error('Error finishing quiz:', error);
      toast.error('Failed to submit quiz');
      setIsFinishing(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center">Loading your quiz...</div>;

  const details = parseDetails(currentQ);

  // Show feedback screen
  if (showFeedback) {
    return (
      <div className="min-h-screen bg-white py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {isCorrect !== null && (
            <div className={`rounded-3xl p-10 text-center ${
              isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
            }`}>
              <h2 className={`text-4xl font-bold mb-2 ${
                isCorrect ? 'text-green-700' : 'text-orange-700'
              }`}>
                {isCorrect ? '✓ Correct!' : '✗ Not Quite'}
              </h2>
              <p className="text-gray-600">
                {isCorrect ? 'Great job! Keep it up.' : "Let's learn from this together."}
              </p>
            </div>
          )}

          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Personalized Feedback</h3>
              <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentFeedback}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Button 
              onClick={proceedToNext}
              disabled={isFinishing}
              className="bg-black text-white px-12 py-6 rounded-2xl font-bold text-lg"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Quiz...
                </>
              ) : currentIdx === questions.length - 1 ? (
                "Finish Quiz"
              ) : (
                "Continue to Next Question"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show question screen
  if (currentQ?.question_type === "ged_extended_response") {
    const stimulusDocumentId = details?.stimulus_document_id;
    const stimulus = stimulusDocumentId ? stimulusByDocId[stimulusDocumentId] : null;
    const essayValue =
      typeof answers[currentQ.id] === "object" && answers[currentQ.id]
        ? String(answers[currentQ.id].essay || "")
        : "";
    const timerText = (() => {
      if (timeLeftSec === null) return null;
      const m = Math.floor(timeLeftSec / 60);
      const s = timeLeftSec % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    })();

    return (
      <div className="h-screen bg-white p-6 overflow-hidden">
        <div className="h-full flex flex-col gap-4">
          <div className="shrink-0 space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full">
              <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400">QUESTION {currentIdx + 1} OF {questions.length}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                {currentQ.subject} • {currentQ.topic}
              </p>
            </div>
            <div className="flex items-center justify-end">
              {timerText ? (
                <div className={`text-xs font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${
                  timeLeftSec !== null && timeLeftSec <= 60 ? "border-red-200 bg-red-50 text-red-700" : "border-zinc-200 bg-white text-zinc-700"
                }`}>
                  Time left: {timerText}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 w-full rounded-3xl border border-zinc-100 overflow-hidden bg-white">
            {/* Left: stimulus */}
            <div
              className="shrink-0 border-r border-zinc-100 bg-zinc-50"
              style={{ width: `${leftPaneWidthPx}px` }}
            >
              <div className="h-full overflow-y-auto p-6">
                {!stimulus ? (
                  <div className="text-sm text-gray-500">
                    Loading reading materials…
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">{stimulus.document.title}</h2>
                      {stimulus.document.time_limit_minutes ? (
                        <p className="text-xs font-bold text-gray-400 mt-2">
                          Suggested time: {stimulus.document.time_limit_minutes} minutes
                        </p>
                      ) : null}
                      {stimulus.document.intro ? (
                        <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{stimulus.document.intro}</p>
                      ) : null}
                    </div>

                    {stimulus.sources.map((src) => (
                      <div key={src.id} className="space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                          {src.label || `Source ${src.sort_order}`}
                        </div>
                        <div className="space-y-1">
                          {src.title ? <div className="font-semibold text-zinc-900">{src.title}</div> : null}
                          {(src.author || src.publication || src.genre) ? (
                            <div className="text-xs text-gray-500">
                              {[src.author, src.publication, src.genre].filter(Boolean).join(" • ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {src.body_markdown}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resize handle */}
            <div
              className={`w-2 shrink-0 cursor-col-resize bg-white hover:bg-zinc-100 ${isResizing ? "bg-zinc-100" : ""}`}
              onMouseDown={() => setIsResizing(true)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize reading materials pane"
            />

            {/* Right: prompt + response */}
            <div className="flex-1">
              <div className="h-full overflow-y-auto p-8 space-y-6">
                <div className="bg-white">
                  <h3 className="text-2xl font-bold text-zinc-900 leading-tight">
                    {details?.prompt || "Extended Response"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Write a well-organized response that uses evidence from the source materials.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-900">Your response</div>
                  <Textarea
                    className="rounded-2xl p-6 min-h-[320px] text-base border-zinc-200 focus:ring-lime-400"
                    placeholder="Write your response here…"
                    value={essayValue}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: { ...(prev[currentQ.id] || {}), essay: e.target.value },
                      }))
                    }
                    disabled={isSubmitting || (timeLeftSec !== null && timeLeftSec <= 0)}
                  />
                  <div className="text-xs text-gray-500">
                    Word count: {essayValue.trim() ? essayValue.trim().split(/\s+/).filter(Boolean).length : 0}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                    disabled={currentIdx === 0 || isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleNext({ force: false, reason: "user" })}
                    className="bg-black text-white px-10 py-6 rounded-2xl font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Feedback...
                      </>
                    ) : currentIdx === questions.length - 1 ? (
                      "Submit Quiz"
                    ) : (
                      "Submit Response"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-gray-100 rounded-full">
            <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-bold text-gray-400">QUESTION {currentIdx + 1} OF {questions.length}</p>
        </div>

        <div className="space-y-8">
          <div className="bg-zinc-50 rounded-3xl p-10 border border-zinc-100">
             <p className="text-lime-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
               {currentQ.subject} • {currentQ.topic}
             </p>
             <h2 className="text-2xl font-bold text-zinc-900 leading-tight">
               {currentQ.question_type === "drag_drop" ? "Match the following correctly:" : details.question}
             </h2>
          </div>

          <div className="space-y-4">
            {currentQ.question_type === "mcq" && details.options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => setAnswers({...answers, [currentQ.id]: opt})}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium ${
                  answers[currentQ.id] === opt ? "border-lime-400 bg-lime-50" : "border-zinc-100 hover:border-zinc-200"
                }`}
                disabled={isSubmitting}
              >
                {opt}
              </button>
            ))}

            {currentQ.question_type === "free_response" && (
              <Textarea 
                className="rounded-2xl p-6 min-h-[160px] text-lg border-zinc-200 focus:ring-lime-400"
                placeholder="Type your answer here..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => setAnswers({...answers, [currentQ.id]: e.target.value})}
                disabled={isSubmitting}
              />
            )}

            {currentQ.question_type === "drag_drop" && (
              <div className="space-y-3">
                {details.qa_pairs.map((pair: { question: string; answer: string }, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="flex-1 font-bold text-zinc-700">{pair.question}</span>
                    <Select 
                      onValueChange={(val: string) => {
                        const current = answers[currentQ.id] || [];
                        current[i] = val;
                        setAnswers({...answers, [currentQ.id]: current});
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-[200px] bg-white rounded-lg">
                        <SelectValue placeholder="Select Match" />
                      </SelectTrigger>
                      <SelectContent>
                        {details.options.map((opt: string) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-10">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} 
            disabled={currentIdx === 0 || isSubmitting}
          >
            Back
          </Button>
          <Button 
            onClick={() => handleNext({ force: false, reason: "user" })} 
            className="bg-black text-white px-10 py-6 rounded-2xl font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Feedback...
              </>
            ) : currentIdx === questions.length - 1 ? (
              "Submit Quiz"
            ) : (
              "Submit Answer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}