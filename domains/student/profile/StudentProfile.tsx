"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StudentProfileClient() {
  const [formData, setFormData] = useState<{
    firstname: string;
    lastname: string;
    plan: string;
    grade_reading: string;
    grade_math: string;
    current_level: string;
    career_interests: string;
    goals: string;
  } | null>(null); // start as null to indicate "not loaded yet"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/student/onboarding", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const temp = await res.json();
        const data = temp.data[0];
        if (!data) return;
        console.log("data.first_name: " + data.first_name);

        // ensure all fields are defined
        setFormData({
          firstname: data.first_name || "a",
          lastname: data.last_name || "a",
          plan: data.plan || "a",
          grade_reading: data.grade_reading || "a",
          grade_math: data.grade_math || "a",
          current_level: data.current_level || "a",
          career_interests: data.career_interests || "a",
          goals: data.goals || "a",
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return; // safety check

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to save profile");

      router.push(data.redirectTo || "/student/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Show loading or error before rendering the form
  if (!formData) return <div>Loading profile...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold">Your Profile</h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-base font-semibold">
              Profile Photo <span className="text-gray-400">(optional)</span>
            </Label>

            <div className="relative">
              <Avatar className="h-32 w-32 bg-gray-200 text-3xl">
                <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold">
                  {formData.firstname?.[0]?.toUpperCase() || ""}{formData.lastname?.[0]?.toUpperCase() || ""}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-lime-300 flex items-center justify-center shadow hover:bg-lime-400 transition"
              >
                <Image src="/camera.png" alt="upload" width={18} height={18} className="object-contain" />
              </button>

              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) console.log(file);
                }}
              />
            </div>

            <p className="text-sm text-gray-400">Help instructors recognize you.</p>
          </div>

          <Input
            placeholder="First name"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            required
          />

          <Input
            placeholder="Last name"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            required
          />
        </div>

        {/* <div className="space-y-6">
          <h3 className="text-xl font-bold">What are your career interests?</h3>
          <Textarea
            placeholder="Tell us more about your interests..."
            className="min-h-[150px]"
            value={formData.career_interests}
            onChange={(e) => setFormData({ ...formData, career_interests: e.target.value })}
          />
        </div> */}

        <div className="space-y-6">
          <h3 className="text-xl font-bold">What are your goals?</h3>
          <Textarea
            placeholder="e.g. I want to earn my GED, improve my writing..."
            className="min-h-[180px]"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            required
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
