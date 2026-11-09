import { NextRequest, NextResponse } from "next/server";
import { verifyPermission } from "@/lib/auth";
import { markEventAttendance, unmarkEventAttendance } from "@/lib/db/repositories/event.repository";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyPermission("events:checkin");
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const { ticketCodeOrIstid } = await request.json();
    if (!ticketCodeOrIstid) {
      return NextResponse.json(
        { error: "Código do bilhete ou IST ID obrigatório" },
        { status: 400 }
      );
    }

    const result = await markEventAttendance(id, ticketCodeOrIstid, auth.user.istid);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyPermission("events:checkin");
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    const { ticketCodeOrIstid } = await request.json();
    if (!ticketCodeOrIstid) {
      return NextResponse.json(
        { error: "Código do bilhete ou IST ID obrigatório" },
        { status: 400 }
      );
    }

    await unmarkEventAttendance(id, ticketCodeOrIstid);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
