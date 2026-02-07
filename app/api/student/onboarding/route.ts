import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const { firstname, lastname, plan, grade_reading, grade_math, current_level, career_interests, goals } = formData;
    
    console.log("Received onboarding data:", formData);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("Supabase URL:", supabaseUrl ? "✓ Found" : "✗ Missing");
    console.log("Service Role Key:", serviceRoleKey ? "✓ Found" : "✗ Missing");
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables!");
      return NextResponse.json(
        { error: "Server configuration error - missing environment variables" },
        { status: 500 }
      );
    }
    
    // Create admin client with service role 
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log("Admin client created successfully");
    
    // Get user from regular client for auth
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", user.id);
    
    // Verify user role from metadata
    const userRole = user.user_metadata?.role;
    console.log("User role from metadata:", userRole);
    
    if (userRole !== 'student') {
      return NextResponse.json(
        { error: "Invalid role for student onboarding" },
        { status: 403 }
      );
    }
    
    // Check if user already has a role in user_role table
    const { data: existingRole } = await supabaseAdmin
      .from('user_role')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (existingRole) {
      console.log("User already has a role:", existingRole);
      return NextResponse.json(
        { error: "User already completed onboarding" },
        { status: 400 }
      );
    }
    
    // Check if student already exists in Students table
    const { data: existingStudent } = await supabaseAdmin
      .from('Students')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (existingStudent) {
      console.log("Student profile already exists");
      return NextResponse.json(
        { error: "Student profile already exists" },
        { status: 400 }
      );
    }
    
    // Step 1: Insert into user_role table (public schema)
    console.log("Inserting into user_role table...");
    const { error: roleError } = await supabaseAdmin
      .from('user_role')
      .insert({
        user_id: user.id,
        role: 'student'
      });
    
    if (roleError) {
      console.error("Role insert error:", roleError);
      return NextResponse.json(
        { error: `Failed to assign role: ${roleError.message}` },
        { status: 400 }
      );
    }
    
    console.log("Role inserted successfully");
    
    // Step 2: Insert into Students table (public schema)
    console.log("Inserting into Students table...");
    
    const studentInsertData: any = {
      id: user.id,
      email: user.email,
      role: 'student',
    };

    // Add first_name and last_name from the form
    if (firstname) studentInsertData.first_name = firstname;
    if (lastname) studentInsertData.last_name = lastname;
    
    // Add optional fields only if they have values AND the column exists
    if (plan) studentInsertData.plan = plan;
    if (grade_reading) studentInsertData.grade_reading = grade_reading;
    if (grade_math) studentInsertData.grade_math = grade_math;
    if (current_level) studentInsertData.current_level = current_level;

    // Add career_interests and goals from the form
    if (career_interests) studentInsertData.career_interests = career_interests;
    if (goals) studentInsertData.goals = goals;
    
    console.log("Data to insert:", studentInsertData);
    
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('Students')
      .insert(studentInsertData)
      .select()
      .single();
    
    if (studentError) {
      console.error("Student insert error:", studentError);
      
      // Rollback: delete the role entry
      await supabaseAdmin
        .from('user_role')
        .delete()
        .eq('user_id', user.id);
      
      return NextResponse.json(
        { error: `Failed to create student profile: ${studentError.message}` },
        { status: 400 }
      );
    }
    
    console.log("Student profile created successfully:", studentData);
    
    return NextResponse.json(
      { 
        message: "Profile created successfully", 
        data: studentData,
        redirectTo: "/student/learning-style-quiz" 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.json();
    const { firstname, lastname, plan, grade_reading, grade_math, current_level, career_interests, goals } = formData;
    
    console.log("Received onboarding data:", formData);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("Supabase URL:", supabaseUrl ? "✓ Found" : "✗ Missing");
    console.log("Service Role Key:", serviceRoleKey ? "✓ Found" : "✗ Missing");
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables!");
      return NextResponse.json(
        { error: "Server configuration error - missing environment variables" },
        { status: 500 }
      );
    }
    
    // Create admin client with service role 
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log("Admin client created successfully");
    
    // Get user from regular client for auth
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", user.id);
    
    // Verify user role from metadata
    const userRole = user.user_metadata?.role;
    console.log("User role from metadata:", userRole);
    
    if (userRole !== 'student') {
      return NextResponse.json(
        { error: "Invalid role for student onboarding" },
        { status: 403 }
      );
    }
    
    // Check if user already has a role in user_role table
    const { data: existingRole } = await supabaseAdmin
      .from('user_role')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!existingRole) {
      console.log("User does not already have a role:", existingRole);
      return NextResponse.json(
        { error: "User has not completed onboarding" },
        { status: 400 }
      );
    }
    
    // Check if student already exists in Students table
    const { data: existingStudent } = await supabaseAdmin
      .from('Students')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!existingStudent) {
      console.log("Student profile does not exist");
      return NextResponse.json(
        { error: "Student profile does not exist" },
        { status: 400 }
      );
    }

    // Step 1: Update Students table (public schema)
    console.log("Inserting into Students table...");
    
    const studentUpdateData: any = {
      id: user.id,
      email: user.email,
      role: 'student',
    };

    // Add first_name and last_name from the form
    if (firstname) studentUpdateData.first_name = firstname;
    if (lastname) studentUpdateData.last_name = lastname;
    
    // Add optional fields only if they have values AND the column exists
    if (plan) studentUpdateData.plan = plan;
    if (grade_reading) studentUpdateData.grade_reading = grade_reading;
    if (grade_math) studentUpdateData.grade_math = grade_math;
    if (current_level) studentUpdateData.current_level = current_level;

    // Add career_interests and goals from the form
    if (career_interests) studentUpdateData.career_interests = career_interests;
    if (goals) studentUpdateData.goals = goals;
    
    console.log("Data to update:", studentUpdateData);
    
    const { data: studentData, error: studentError } = await supabaseAdmin
      // .from('Students')
      // .update(studentUpdateData)
      // .select()
      // .single();
      .from("Students")
      .update(studentUpdateData)
      .eq("id", user.id)
      .select()
      .single();
      
    if (studentError) {
      console.error("Student update error:", studentError);
      return NextResponse.json(
        { error: `Failed to create student profile: ${studentError.message}` },
        { status: 400 }
      );
    }
      
    return NextResponse.json(
      { 
        message: "Profile updated successfully", 
        data: studentData,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables!");
      return NextResponse.json(
        { error: "Server configuration error - missing environment variables" },
        { status: 500 }
      );
    }
    
    // Create admin client with service role 
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("Admin client created successfully");

    // Get user from regular client for auth
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", user.id);

    const { data: studentData } = await supabaseAdmin
      .from('Students')
      .select()
      .eq('id', user.id)
    
    if (!studentData) {
      console.log("Student profile does not exist");
      return NextResponse.json(
        { error: "Student profile does not exist" },
        { status: 404 }
      );
    }  

    console.log("student data: ", studentData);
    return NextResponse.json(
      {
        message: "Student profile info retreived successfully",
        data: studentData, 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error GETting student data: ", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}