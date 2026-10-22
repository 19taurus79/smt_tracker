import { NextResponse } from "next/server";
import { getAllTrainees, updateTraineeDetails, deleteTraineeProfile } from "@/lib/server/traineeStorage";

export async function GET() {
  try {
    const trainees = getAllTrainees();
    return NextResponse.json({ ok: true, trainees });
  } catch (error) {
    console.error("[Coach Trainees API] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, updates } = body;

    if (action === "update" && id && updates) {
      const updated = updateTraineeDetails(id, updates);
      return NextResponse.json({ ok: true, trainee: updated });
    }

    if (action === "delete" && id) {
      const deleted = deleteTraineeProfile(id);
      return NextResponse.json({ ok: true, deleted });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Coach Trainees API] Error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
