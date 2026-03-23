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
      <h2 className="text-2xl font-bold">Your Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile photo + name side by side */}
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            <Avatar className="h-28 w-28 bg-gray-200">
              <AvatarFallback className="bg-gray-300 text-gray-700 font-semibold text-2xl">
                {formData.firstname?.[0]?.toUpperCase() || ""}
                {formData.lastname?.[0]?.toUpperCase() || ""}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => document.getElementById("photo-upload")?.click()}
              className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-lime-400 flex items-center justify-center shadow"
            >
              <Image src="/camera.png" alt="upload" width={16} height={16} />
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

          <div className="flex flex-col gap-3 flex-1">
            <div>
              <Label className="font-semibold mb-1 block">First Name</Label>
              <Input
                placeholder="Type Name"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="font-semibold mb-1 block">Last Name</Label>
              <Input
                placeholder="Type Name"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Career Interests */}
        <div className="space-y-3">
          <h3 className="text-base font-bold">Career Interests</h3>
          <Textarea
            placeholder="Tell us about your career goals..."
            className="min-h-[120px]"
            value={formData.career_interests}
            onChange={(e) => setFormData({ ...formData, career_interests: e.target.value })}
          />
        </div>

        {/* Goals */}
        <div className="space-y-3">
          <h3 className="text-base font-bold">Goals for being in 8MS</h3>
          <Textarea
            placeholder="Tell us what you hope to achieve..."
            className="min-h-[180px]"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Submit */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading}
            className="bg-lime-400 hover:bg-lime-500 text-black font-medium rounded-full px-12"
          >
            {loading ? "Saving..." : "Done"}
          </Button>
        </div>
      </form>
    </div>
  );
}