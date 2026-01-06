import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseURL || !supabaseKEY) {
    return NextResponse.json(
      { error: "Supabase environment variables not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseURL, supabaseKEY);

  try {
    const { data: students, error } = await supabase
      .from("Students")
      .select(
        `
        id,
        email,
        progress,
        isActive,
        first_name,
        last_name,
        avatar
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    // normalize status to what frontend expects
    const formattedStudents = students.map((s) => ({
      id: s.id,
      email: s.email,
      progress: s.progress,
      status: s.isActive ? "On Track" : "At Risk",
      first_name: s.first_name,
      last_name: s.last_name,
      avatar: s.avatar,
    }));

    return NextResponse.json({
      students: formattedStudents,
      total: formattedStudents.length,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
