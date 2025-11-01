import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, age, career_interests, learning_goals } = await request.json();
    
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { data, error } = await supabase
      .from('Students') 
      .insert({
        uiud: user.id,
        email: user.email,  
        name,
        age,
        career_interests,
        learning_goals
        // learning_style will be NULL or have default value
      });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: "Profile created successfully", data },
      { status: 200 }
    );
    
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}