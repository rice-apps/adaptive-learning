"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LearningStyleQuiz() {
  const router = useRouter();
  
  // Form state
  const [reasonForGED, setReasonForGED] = useState("");
  const [worriedSubject, setWorriedSubject] = useState("");
  const [learnBest, setLearnBest] = useState("");
  const [hardFactors, setHardFactors] = useState<string[]>([]);
  const [hardFactorOther, setHardFactorOther] = useState("");
  const [appFeatures, setAppFeatures] = useState<string[]>([]);
  const [wrongAnswerAction, setWrongAnswerAction] = useState("");
  const [importance, setImportance] = useState("");
  const [oneThing, setOneThing] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hard factors options
  const hardFactorOptions = [
    "Not enough time",
    "Material is confusing",
    "I get distracted",
    "I'm afraid of failing",
    "I forget things",
  ];

  // App features options
  const appFeatureOptions = [
    "Shows me what I need to work on",
    "Explains things simply",
    "I can go at my own pace",
    "Shows my progress",
    "Gives practice questions",
    "My teacher can see how I'm doing",
    "Encourages me when I make mistakes",
  ];

  // Handle hard factors checkbox
  const handleHardFactorChange = (factor: string, checked: boolean) => {
    if (checked) {
      if (hardFactors.length < 2) {
        setHardFactors([...hardFactors, factor]);
      } else {
        toast.error("You can only select 2 options");
      }
    } else {
      setHardFactors(hardFactors.filter((f) => f !== factor));
    }
  };

  // Handle app features checkbox
  const handleAppFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      if (appFeatures.length < 3) {
        setAppFeatures([...appFeatures, feature]);
      } else {
        toast.error("You can only select 3 options");
      }
    } else {
      setAppFeatures(appFeatures.filter((f) => f !== feature));
    }
  };

  // Validate form
  const validateForm = () => {
    if (!reasonForGED.trim()) {
      toast.error("Please provide a reason for getting your GED");
      return false;
    }
    if (!worriedSubject) {
      toast.error("Please select which GED subject worries you most");
      return false;
    }
    if (!learnBest) {
      toast.error("Please select how you learn best");
      return false;
    }
    if (hardFactors.length !== 2) {
      toast.error("Please select exactly 2 factors that make learning hard for you");
      return false;
    }
    if (hardFactors.includes("Other") && !hardFactorOther.trim()) {
      toast.error("Please specify what makes learning hard for you");
      return false;
    }
    if (appFeatures.length !== 3) {
      toast.error("Please select exactly 3 features that would make you want to use a learning app");
      return false;
    }
    if (!wrongAnswerAction) {
      toast.error("Please select what you want most when you get a question wrong");
      return false;
    }
    if (!importance) {
      toast.error("Please select how important it is that the app learns your way of learning");
      return false;
    }
    if (!oneThing.trim()) {
      toast.error("Please tell us one thing to make this platform work for you");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to submit this quiz");
        setIsSubmitting(false);
        return;
      }

      // Prepare learning style data
      const learningStyleData = {
        reasonForGED: reasonForGED.trim(),
        worriedSubject,
        learnBest,
        hardFactors: hardFactors.includes("Other") 
          ? [...hardFactors.filter(f => f !== "Other"), hardFactorOther.trim()]
          : hardFactors,
        appFeatures,
        wrongAnswerAction,
        importance,
        oneThing: oneThing.trim(),
        completedAt: new Date().toISOString(),
      };

      // Update Students table
      const { error } = await supabase
        .from("Students")
        .update({ learning_style: learningStyleData })
        .eq("userid", user.id);

      if (error) {
        console.error("Error updating learning style:", error);
        toast.error("Failed to save your responses. Please try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Learning style quiz completed successfully!");
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Learning Style Quiz</h1>
      
      <div className="space-y-8">
        {/* Question 1: Reason for GED */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            What&apos;s your main reason for getting your GED?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter your reason"
            value={reasonForGED}
            onChange={(e) => setReasonForGED(e.target.value)}
            required
          />
        </div>

        {/* Question 2: Worried Subject */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            Which GED subject worries you most?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Select value={worriedSubject} onValueChange={setWorriedSubject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Language Arts">Language Arts</SelectItem>
              <SelectItem value="Social Studies">Social Studies</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question 3: Learn Best */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            How do you learn best?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Select value={learnBest} onValueChange={setLearnBest}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Seeing pictures and diagrams">
                Seeing pictures and diagrams
              </SelectItem>
              <SelectItem value="Listening to explanations">
                Listening to explanations
              </SelectItem>
              <SelectItem value="Reading and taking notes">
                Reading and taking notes
              </SelectItem>
              <SelectItem value="Doing hands-on practice">
                Doing hands-on practice
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question 4: Hard Factors (pick top 2) */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            What makes learning hard for you? (pick top 2)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="space-y-2">
            {hardFactorOptions.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hardFactors.includes(option)}
                  onChange={(e) => handleHardFactorChange(option, e.target.checked)}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hardFactors.includes("Other")}
                onChange={(e) => handleHardFactorChange("Other", e.target.checked)}
                className="w-4 h-4"
              />
              <span>Other:</span>
              {hardFactors.includes("Other") && (
                <Input
                  type="text"
                  placeholder="Please specify"
                  value={hardFactorOther}
                  onChange={(e) => setHardFactorOther(e.target.value)}
                  className="flex-1"
                />
              )}
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Selected: {hardFactors.length}/2
          </p>
        </div>

        {/* Question 5: App Features (pick top 3) */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            What would make you want to use a learning app? (pick top 3)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="space-y-2">
            {appFeatureOptions.map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appFeatures.includes(option)}
                  onChange={(e) => handleAppFeatureChange(option, e.target.checked)}
                  className="w-4 h-4"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Selected: {appFeatures.length}/3
          </p>
        </div>

        {/* Question 6: Wrong Answer Action */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            When you get a question wrong, what do you want most out of the following:
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Select value={wrongAnswerAction} onValueChange={setWrongAnswerAction}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Show me the right answer">
                Show me the right answer
              </SelectItem>
              <SelectItem value="Explain why I was wrong">
                Explain why I was wrong
              </SelectItem>
              <SelectItem value="Give me a hint to try again">
                Give me a hint to try again
              </SelectItem>
              <SelectItem value="Show me an example">
                Show me an example
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question 7: Importance */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            How important is it that the app learns your way of learning?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Select value={importance} onValueChange={setImportance}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Very important">Very important</SelectItem>
              <SelectItem value="Somewhat important">Somewhat important</SelectItem>
              <SelectItem value="Not important">Not important</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question 8: One Thing */}
        <div className="space-y-2">
          <label className="text-lg font-semibold">
            If you could tell us one thing to make this platform work for you, what would it be?
            <span className="text-red-500 ml-1">*</span>
          </label>
          <Input
            type="text"
            placeholder="Enter your response"
            value={oneThing}
            onChange={(e) => setOneThing(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}

