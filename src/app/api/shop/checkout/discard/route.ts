import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { getCheckoutSession, discardCheckoutSession } from "@/lib/redis/sessions";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(req: NextRequest) {
  try {
    const authSession = await getAuthenticatedUser();
    if (!authSession?.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const user = authSession.user;

    const body = await req.json();
    const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber : body.order_number;

    if (!orderNumber || typeof orderNumber !== "string")
      return NextResponse.json({ error: "Número de encomenda em falta." }, { status: 400 });

    const session = await getCheckoutSession(orderNumber);
    if (session) {
      const isOwner = session.user_istid === user.istid;
      const isStaff = hasPermission(user, "pos:access") || hasPermission(user, "orders:write");
      if (!isOwner && !isStaff)
        return NextResponse.json({ error: "Permissões insuficientes." }, { status: 403 });
      await discardCheckoutSession(orderNumber);
    }

    return NextResponse.json({ success: true, discarded: Boolean(session) });
  } catch (error) {
    return handleApiError(error);
  }
}
