import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCheckoutSession } from "@/lib/redis/sessions";
import { promoteRedisCheckoutSessionToReservation } from "@/utils/shop/orderFinalization";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const body = await req.json();
    const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";

    if (!orderNumber)
      return NextResponse.json({ error: "Número de encomenda em falta." }, { status: 400 });

    const checkoutSession = await getCheckoutSession(orderNumber);
    if (!checkoutSession)
      return NextResponse.json(
        { error: "A sessão de checkout expirou. Volta ao carrinho." },
        { status: 410 }
      );

    if (!checkoutSession.user_istid || checkoutSession.user_istid !== session.user.istid)
      return NextResponse.json({ error: "Sem permissão para esta encomenda." }, { status: 403 });

    const order = await promoteRedisCheckoutSessionToReservation(checkoutSession);
    if (!order)
      return NextResponse.json({ error: "Não foi possível criar a reserva." }, { status: 500 });

    return NextResponse.json({ orderNumber: order.order_number });
  } catch (error) {
    return handleApiError(error);
  }
}
