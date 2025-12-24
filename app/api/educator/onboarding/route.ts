import {NextResponse} from "next/server";
import educatorManager from "@/domains/api/managers/educatorManager";

export async function POST(request: Request) {
  try {
    const result = await educatorManager.addEducator();

    return NextResponse.json({success: true, data: result}, {status: 200});
  } catch (error) {
    return NextResponse.json(
      {success: false, error: error instanceof Error ? error.message : "Unknown error"},
      {status: 500},
    );
  }
}
