"use client";
import {useMutation} from "@tanstack/react-query";

interface EducatorOnboardingResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function educatorOnboarding(): Promise<EducatorOnboardingResponse> {
  const response = await fetch("/api/educator/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to complete educator onboarding");
  }

  return response.json();
}

export function useEducatorOnboarding() {
  return useMutation({
    mutationFn: educatorOnboarding,
  });
}
