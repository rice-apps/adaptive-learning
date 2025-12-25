"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function StudentOnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    plan: "",
    grade_reading: "",
    grade_math: "",
    current_level: "",
    career_interests: "",
    goals: "",
  });

  const stepOneValid =
    formData.firstname.trim() !== "" && formData.lastname.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create profile");
      }

      // Redirect to dashboard
      router.push(data.redirectTo || "/student/dashboard");
      router.refresh(); // Refresh to update any server components
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto p-8">
        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Create your profile</h2>
              <span className="text-sm text-gray-500">Step {step} of 3</span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold">
              Ready to ace the GED?
            </CardTitle>
            <CardTitle className="text-sm text-gray-400">
              Let's start with the basics.
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <StepOne formData={formData} setFormData={setFormData} />
              )}

              {step === 2 && (
                <StepTwo formData={formData} setFormData={setFormData} />
              )}

              {step === 3 && (
                <StepThree formData={formData} setFormData={setFormData} />
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                    >
                      Back
                    </Button>
                  )}
                </div>

                {step < 3 ? (
                  <Button
                    type="button"
                    className="bg-lime-300 text-black rounded-full px-8 disabled:opacity-50"
                    disabled={!stepOneValid}
                    onClick={() => setStep(step + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-lime-300 text-black rounded-full px-8"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Done"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StepOne({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      {/* Profile photo */}
      <div className="flex flex-col items-center gap-3">
        <Label className="text-base font-semibold">
          Profile Photo <span className="text-gray-400">(optional)</span>
        </Label>

        <div className="relative">
          {/* Avatar */}
          <Avatar className="h-32 w-32 bg-gray-200 text-3xl">
            {/* add uploaded image here */}
            {/* <AvatarImage src={photoUrl} /> */}

            <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold">
              {formData.firstname || formData.lastname
                ? `${formData.firstname?.[0]?.toUpperCase() ?? ""}${
                    formData.lastname?.[0]?.toUpperCase() ?? ""
                  }`
                : "?"}
            </AvatarFallback>
          </Avatar>

          {/* Camera badge */}
          <button
            type="button"
            onClick={() => document.getElementById("photo-upload")?.click()}
            className="
              absolute
              bottom-1
              right-1
              h-10
              w-10
              rounded-full
              bg-lime-300
              flex
              items-center
              justify-center
              shadow
              hover:bg-lime-400
              transition
            "
          >
            <Image
              src="/camera.png"
              alt="upload"
              width={18}
              height={18}
              className="object-contain"
            />
          </button>

          {/* File input */}
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: handle upload later
                console.log(file);
              }
            }}
          />
        </div>

        <p className="text-sm text-gray-400">Help instructors recognize you.</p>
      </div>

      <Input
        placeholder="First name"
        value={formData.firstname}
        onChange={(e) =>
          setFormData({ ...formData, firstname: e.target.value })
        }
        required
      />

      <Input
        placeholder="Last name"
        value={formData.lastname}
        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
        required
      />
    </div>
  );
}

function StepTwo({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">What are your career interests?</h3>
      <p className="text-gray-500">
        Select areas you’re curious about or want to explore.
      </p>

      <Textarea
        placeholder="Tell us more about your interests..."
        className="min-h-[150px]"
        value={formData.career_interests}
        onChange={(e) =>
          setFormData({ ...formData, career_interests: e.target.value })
        }
      />
    </div>
  );
}

function StepThree({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">What are your goals?</h3>
      <p className="text-gray-500">
        What do you hope to achieve with Eight Million Stories?
      </p>

      <div className="bg-lime-100 border border-lime-300 rounded-lg p-4 text-sm">
        <p className="font-medium mb-2">Think about:</p>
        <ul className="list-disc list-inside">
          <li>Education milestones</li>
          <li>Skills you want to learn</li>
          <li>Jobs you’re interested in</li>
        </ul>
      </div>

      <Textarea
        placeholder="e.g. I want to earn my GED, improve my writing..."
        className="min-h-[180px]"
        value={formData.goals}
        onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
        required
      />
    </div>
  );
}
