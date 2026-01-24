"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type QuestionType = "text" | "select" | "multi-select" | "multi-select-other";

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  instructions?: string;
  options?: string[];
  maxSelections?: number;
}

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  // Questions configuration
  const questions: Question[] = [
    {
      id: "reasonForGED",
      type: "text",
      label: "What's your main reason for getting your GED?",
    },
    {
      id: "worriedSubject",
      type: "select",
      label: "Which GED subject worries you most?",
      options: ["Language Arts", "Social Studies", "Science", "Math"],
    },
    {
      id: "learnBest",
      type: "select",
      label: "How do you learn best?",
      options: [
        "Seeing pictures and diagrams",
        "Listening to explanations",
        "Reading and taking notes",
        "Doing hands-on practice",
      ],
    },
    {
      id: "hardFactors",
      type: "multi-select-other",
      label: "What makes learning hard for you?",
      instructions: "Pick top 2",
      options: hardFactorOptions,
      maxSelections: 2,
    },
    {
      id: "appFeatures",
      type: "multi-select",
      label: "What would make you want to use a learning app?",
      instructions: "Pick top 3",
      options: appFeatureOptions,
      maxSelections: 3,
    },
    {
      id: "wrongAnswerAction",
      type: "select",
      label:
        "When you get a question wrong, what do you want most out of the following:",
      options: [
        "Show me the right answer",
        "Explain why I was wrong",
        "Give me a hint to try again",
        "Show me an example",
      ],
    },
    {
      id: "importance",
      type: "select",
      label: "How important is it that the app learns your way of learning?",
      options: ["Very important", "Somewhat important", "Not important"],
    },
    {
      id: "oneThing",
      type: "text",
      label:
        "If you could tell us one thing to make this platform work for you, what would it be?",
    },
  ];

  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

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

  // Get current question value
  const getCurrentQuestionValue = (questionId: string) => {
    switch (questionId) {
      case "reasonForGED":
        return reasonForGED;
      case "worriedSubject":
        return worriedSubject;
      case "learnBest":
        return learnBest;
      case "hardFactors":
        return hardFactors;
      case "appFeatures":
        return appFeatures;
      case "wrongAnswerAction":
        return wrongAnswerAction;
      case "importance":
        return importance;
      case "oneThing":
        return oneThing;
      default:
        return "";
    }
  };

  // Set current question value
  const setCurrentQuestionValue = (questionId: string, value: any) => {
    switch (questionId) {
      case "reasonForGED":
        setReasonForGED(value);
        break;
      case "worriedSubject":
        setWorriedSubject(value);
        break;
      case "learnBest":
        setLearnBest(value);
        break;
      case "wrongAnswerAction":
        setWrongAnswerAction(value);
        break;
      case "importance":
        setImportance(value);
        break;
      case "oneThing":
        setOneThing(value);
        break;
    }
  };

  // Validate current question
  const validateCurrentQuestion = (): boolean => {
    const question = questions[currentQuestionIndex];
    const value = getCurrentQuestionValue(question.id);

    if (question.type === "text") {
      if (!value || (typeof value === "string" && !value.trim())) {
        toast.error("Please answer this question");
        return false;
      }
    } else if (question.type === "select") {
      if (!value) {
        toast.error("Please select an option");
        return false;
      }
    } else if (
      question.type === "multi-select" ||
      question.type === "multi-select-other"
    ) {
      if (!Array.isArray(value) || value.length !== question.maxSelections) {
        toast.error(
          `Please select exactly ${question.maxSelections} option${
            question.maxSelections! > 1 ? "s" : ""
          }`
        );
        return false;
      }
      if (
        question.type === "multi-select-other" &&
        value.includes("Other") &&
        !hardFactorOther.trim()
      ) {
        toast.error("Please specify what makes learning hard for you");
        return false;
      }
    }
    return true;
  };

  // Handle next button
  const handleNext = () => {
    if (!validateCurrentQuestion()) {
      return;
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
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
      toast.error(
        "Please select exactly 2 factors that make learning hard for you"
      );
      return false;
    }
    if (hardFactors.includes("Other") && !hardFactorOther.trim()) {
      toast.error("Please specify what makes learning hard for you");
      return false;
    }
    if (appFeatures.length !== 3) {
      toast.error(
        "Please select exactly 3 features that would make you want to use a learning app"
      );
      return false;
    }
    if (!wrongAnswerAction) {
      toast.error(
        "Please select what you want most when you get a question wrong"
      );
      return false;
    }
    if (!importance) {
      toast.error(
        "Please select how important it is that the app learns your way of learning"
      );
      return false;
    }
    if (!oneThing.trim()) {
      toast.error(
        "Please tell us one thing to make this platform work for you"
      );
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("You must be logged in to submit this quiz");
        setIsSubmitting(false);
        return;
      }
      console.log("Submitting quiz for Auth User ID:", user.id);

      // Prepare learning style data
      const learningStyleData = {
        reasonForGED: reasonForGED.trim(),
        worriedSubject,
        learnBest,
        hardFactors: hardFactors.includes("Other")
          ? [
              ...hardFactors.filter((f) => f !== "Other"),
              hardFactorOther.trim(),
            ]
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
        .eq("id", user.id);

      if (error) {
        // --- START DEBUGGING ---
        // Log the full error to the console to see its properties
        console.log("Full error object:", JSON.stringify(error, null, 2));

        // Log specific PostgrestError properties if they exist
        console.error("Error Code:", error?.code);
        console.error("Error Message:", error?.message);
        console.error("Error Details:", error?.details);
        // --- END DEBUGGING ---

        // Original line (you can keep or remove)
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

  // Render current question
  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    const value = getCurrentQuestionValue(question.id);

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Question Box */}
        <div className="bg-gray-100 rounded-lg p-4 sm:p-6 min-h-[150px] sm:min-h-[200px] flex items-center">
          <div className="w-full">
            <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Question</p>
            <p className="text-base sm:text-xl font-semibold">{question.label}</p>
            {question.instructions && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
                {question.instructions}
              </p>
            )}
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-2 sm:space-y-3">
          {question.type === "text" && (
            <Input
              type="text"
              placeholder="Enter your response"
              value={value as string}
              onChange={(e) =>
                setCurrentQuestionValue(question.id, e.target.value)
              }
              className="w-full text-sm sm:text-base"
              autoFocus
            />
          )}

          {question.type === "select" && question.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              {question.options.map((option) => (
                <label
                  key={option}
                  className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) =>
                      setCurrentQuestionValue(question.id, e.target.value)
                    }
                    className="mt-0.5 sm:mt-1 w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block text-gray-900 text-sm sm:text-base">
                      {option}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {question.type === "multi-select" && question.options && (
            <div className="space-y-2 sm:space-y-3">
              {question.options.map((option) => {
                const isChecked =
                  Array.isArray(value) && value.includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (question.id === "appFeatures") {
                          handleAppFeatureChange(option, e.target.checked);
                        }
                      }}
                      className="mt-0.5 sm:mt-1 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block text-gray-900 text-sm sm:text-base">
                        {option}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 block mt-0.5 sm:mt-1">
                        specifics
                      </span>
                    </div>
                  </label>
                );
              })}
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Selected: {Array.isArray(value) ? value.length : 0}/
                {question.maxSelections}
              </p>
            </div>
          )}

          {question.type === "multi-select-other" && question.options && (
            <div className="space-y-2 sm:space-y-3">
              {question.options.map((option) => {
                const isChecked =
                  Array.isArray(value) && value.includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        handleHardFactorChange(option, e.target.checked)
                      }
                      className="mt-0.5 sm:mt-1 w-4 h-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block text-gray-900 text-sm sm:text-base">
                        {option}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 block mt-0.5 sm:mt-1">
                        specifics
                      </span>
                    </div>
                  </label>
                );
              })}
              <label className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes("Other")}
                  onChange={(e) =>
                    handleHardFactorChange("Other", e.target.checked)
                  }
                  className="mt-0.5 sm:mt-1 w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold block text-gray-900 text-sm sm:text-base mb-2">
                    Other:
                  </span>
                  {Array.isArray(value) && value.includes("Other") && (
                    <Input
                      type="text"
                      placeholder="Please specify"
                      value={hardFactorOther}
                      onChange={(e) => setHardFactorOther(e.target.value)}
                      className="w-full text-sm sm:text-base"
                      autoFocus
                    />
                  )}
                </div>
              </label>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                Selected: {Array.isArray(value) ? value.length : 0}/
                {question.maxSelections}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-4xl py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
            <div
              className="bg-gray-600 h-2 sm:h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        {renderQuestion()}

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="sm:mr-3 text-sm sm:text-base"
          >
            Previous
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={isSubmitting}
            className="text-sm sm:text-base"
          >
            {currentQuestionIndex === totalQuestions - 1
              ? isSubmitting
                ? "Submitting..."
                : "Submit"
              : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}