import {NextResponse} from "next/server";
import studentResultManager from "@/domains/api/managers/studentResultManager";

export async function GET(request: Request, {params}: {params: Promise<{studentId: string}>}) {
  try {
    const {studentId} = await params;

    if (!studentId) {
      return NextResponse.json({error: "Student ID is required"}, {status: 400});
    }

    const results = await studentResultManager.getResultsByStudent(studentId);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : "Unknown error"}, {status: 500});
  }
}