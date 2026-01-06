import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseURL || !supabaseKEY) {
  throw new Error("missing supabase environment variables");
}

const supabase = createClient(supabaseURL, supabaseKEY);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // Fetch student with JSONB attributes
    const { data: student, error: studentError } = await supabase
      .from("Students")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        avatar,
        attributes
      `
      )
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      console.error("Student fetch error:", studentError);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Extract and transform the JSONB data
    const attributes = student.attributes || {};

    // Transform strengths from parallel arrays
    const strengthSkills = attributes["strength-skill"] || [];
    const strengthDescriptions = attributes["strength-description"] || [];
    const strengths = strengthSkills.map((skill: string, index: number) => ({
      skill,
      description: strengthDescriptions[index] || "No description available",
    }));

    // Transform weaknesses from parallel arrays
    const weaknessSkills =
      attributes["weakness-skill"] || attributes["weaknesses-skill"] || [];
    const weaknessDescriptions =
      attributes["weakness-description"] ||
      attributes["weaknesses-description"] ||
      [];
    const weaknesses = weaknessSkills.map((skill: string, index: number) => ({
      skill,
      description: weaknessDescriptions[index] || "No description available",
    }));

    // Transform lesson history from parallel arrays
    const assignments = attributes["lessonHistory-assignments"] || [];
    const lastAttempts = attributes["lessonHistory-lastAttempt"] || [];
    const feedbacks = attributes["lessonHistory-feedback"] || [];
    const dates = attributes["lessonHistory-date"] || [];

    const lessonHistory = assignments.map(
      (assignment: string, index: number) => ({
        assignment,
        lastAttempt: lastAttempts[index] || "Not attempted",
        feedback: feedbacks[index] || "No feedback yet",
        date: dates[index] || "Unknown date",
      })
    );

    // Calculate derived fields
    const totalLessons = lessonHistory.length;

    // Format last active (you might want to calculate this from actual activity data)
    const lastActive =
      lessonHistory.length > 0
        ? `${dates[0] || "Recently"}`
        : "No recent activity";

    // Return the formatted response
    return NextResponse.json({
      id: student.id,
      name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
      email: student.email,
      avatar: student.avatar,

      strengths: Array.isArray(strengths) ? strengths.slice(0, 3) : [],
      weaknesses: Array.isArray(weaknesses) ? weaknesses.slice(0, 3) : [],
      lessonHistory: Array.isArray(lessonHistory)
        ? lessonHistory.slice(0, 20)
        : [],

      lastActive,
      totalLessons,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
