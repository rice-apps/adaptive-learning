import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, educatorId, totalQuestions, focusAreas } = body;

    console.log("--- [Generate Smart] Request Received ---");
    console.log("Inputs:", { studentId, educatorId, totalQuestions, focusAreas });

    // 1. Validate required fields
    if (!studentId || !totalQuestions) {
      return NextResponse.json(
        { error: "studentId and totalQuestions are required" },
        { status: 400 }
      );
    }

    // 2. Auth/Educator Logic
    const supabase = await createClient();
    let finalEducatorId = educatorId;
    
    if (!finalEducatorId) {
      console.log("Fetching educator from auth...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: educator } = await supabase
          .from('Educators')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (educator) finalEducatorId = educator.id;
        else return NextResponse.json({ error: "Educator not found" }, { status: 404 });
      } else {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    }

    // 3. IMPORT AND EXECUTE STEP DIRECTLY
    console.log("Importing step...");
    
    const { generateDistributionStep } = await import('@/mastra/workflows/distribution-workflow');
    
    console.log("Executing step directly...");
    
    // Create execution context
    const executionContext: any = {
      inputData: {
        studentId,
        totalQuestions,
        focusAreas: focusAreas || [],
        requiredQuestionIds: [],
      },
      mastra: mastra,
    };
    
    // Call the step's execute function directly
    const runResult = await generateDistributionStep.execute(executionContext);

    console.log("--- [Generate Smart] Workflow Output ---");
    console.log(JSON.stringify(runResult, null, 2));

    // 4. EXTRACT RESULTS
    const finalOutput = runResult;

    if (!finalOutput || !finalOutput.selectedQuestionIds) {
      console.error("Structure mismatch. Keys found:", Object.keys(runResult || {}));
      throw new Error('Workflow completed but returned no valid question data');
    }

    console.log(`✅ Extracted ${finalOutput.selectedQuestionIds.length} questions`);

    // 5. Save to Supabase
    const { data: quiz, error: quizError } = await supabase
      .from('Quizzes')
      .insert({
        questions: finalOutput.selectedQuestionIds,
        educator_id: finalEducatorId,
        student_id: studentId,
      })
      .select()
      .single();

    if (quizError) {
      console.error("Supabase Error:", quizError);
      return NextResponse.json({ error: quizError.message }, { status: 500 });
    }

    console.log("✅ Quiz created successfully:", quiz.id);

    return NextResponse.json({
      success: true,
      quiz,
      topicDistribution: finalOutput.topicDistribution,
      reasoning: finalOutput.reasoning,
      selectedQuestions: finalOutput.selectedQuestionIds,
    });

  } catch (error) {
    console.error("--- [Generate Smart] Fatal Error ---");
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}