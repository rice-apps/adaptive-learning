import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseURL || !supabaseKEY) {
  throw new Error("missing supabase environment variables");
}

const supabase = createClient(supabaseURL, supabaseKEY);

export async function GET() {
  try {
    // Fetch all students with diagnostic_results
    const { data: students, error: studentsError } = await supabase
      .from("Students")
      .select("id, diagnostic_results")
      .not("diagnostic_results", "is", null);

    if (studentsError) {
      console.error("Students fetch error:", studentsError);
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Calculate averages by subject
    const subjectTotals: Record<string, { correct: number; total: number }> = {};

    students.forEach((student) => {
      const diagnosticResults = student.diagnostic_results;
      const perfBySubject = diagnosticResults?.performance_by_subject || {};

      Object.entries(perfBySubject).forEach(([subject, data]: [string, any]) => {
        if (!subjectTotals[subject]) {
          subjectTotals[subject] = { correct: 0, total: 0 };
        }
        subjectTotals[subject].correct += data.correct || 0;
        subjectTotals[subject].total += data.total || 0;
      });
    });

    // Calculate average percentage for each subject
    const chartData = Object.entries(subjectTotals).map(([subject, data]) => {
      const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      
      // Map RLA to Language Arts for display
      const displayName = subject === "RLA" ? "Language Arts" : subject;
      
      return {
        name: displayName,
        score: percentage,
      };
    });

    // Sort to maintain consistent order: Math, Language Arts, Social Studies, Science
    const subjectOrder = ["Math", "Language Arts", "Social Studies", "Science"];
    chartData.sort((a, b) => {
      const indexA = subjectOrder.indexOf(a.name);
      const indexB = subjectOrder.indexOf(b.name);
      return indexA - indexB;
    });

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error("Error fetching proficiency data:", error);
    return NextResponse.json(
      { error: "Failed to fetch proficiency data" },
      { status: 500 }
    );
  }
}