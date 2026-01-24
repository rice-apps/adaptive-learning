"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEducatorOnboarding } from "./hooks/useEducatorOnboarding";

export default function OnboardingForm() {
  const router = useRouter();
  const { mutate: insertEducator, isPending } = useEducatorOnboarding();

  const handleFinishOnboarding = () => {
    insertEducator(undefined, {
      onSuccess: () => {
        toast.success("Onboarding completed successfully!");
        router.push("/educator/dashboard");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to complete onboarding");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Educator Onboarding
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
          Complete your setup to start managing your students and courses.
        </p>
        <Button
          onClick={handleFinishOnboarding}
          disabled={isPending}
          className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
        >
          {isPending ? "Processing..." : "Finish Onboarding"}
        </Button>
      </div>
    </div>
  );
}