"use client";

import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {useEducatorOnboarding} from "./hooks/useEducatorOnboarding";

export default function OnboardingForm() {
  const router = useRouter();
  const {mutate: insertEducator, isPending} = useEducatorOnboarding();

  const handleFinishOnboarding = () => {
    insertEducator(undefined, {
      onSuccess: () => {
        toast.success("Onboarding completed successfully!");
        router.push("/educator/dashboard");
        router.refresh();
      },
      onError: error => {
        toast.error(error.message || "Failed to complete onboarding");
      },
    });
  };

  return (
    <div>
      <h1>Educator Onboarding</h1>
      <Button onClick={handleFinishOnboarding} disabled={isPending}>
        {isPending ? "Processing..." : "Finish Onboarding"}
      </Button>
    </div>
  );
}
