import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseURL || !supabaseKEY) {
  throw new Error("missing supabase environment variables");
}

const supabase = createClient(supabaseURL, supabaseKEY);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query || query.trim() === "") {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from("question_stimulus_sources")
      .select("id, title, author, genre, publication")
      .ilike("title", `%${query}%`)
      .limit(5);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}