import { NextRequest, NextResponse } from "next/server";
import { getActivityByIdFromDb } from "@/lib/db/repositories/event.repository";
import { generateEventIcs } from "@/lib/email";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const activity = await getActivityByIdFromDb(id);
    if (!activity) return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });

    const start = activity.start || new Date();
    const end = activity.end || null;
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
    const title = activity.title || "Atividade";
    const icsContent = generateEventIcs({
      title,
      description: activity.description,
      location: activity.location,
      start,
      end,
      url: `${baseUrl}/activities?event=${activity.id}`,
    });

    const safeFilename = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
