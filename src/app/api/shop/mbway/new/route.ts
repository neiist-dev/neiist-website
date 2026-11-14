import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { resolvePaymentTarget } from "@/lib/shop/checkout";
import { getRemainingSessionSeconds, saveCheckoutSession } from "@/lib/redis/sessions";
import {
  formatMbWayPhone,
  requestMbWayPayment,
  saveMbWayCachedRequest,
} from "@/lib/payments/ifthenpay";
import { handleApiError } from "@/utils/apiErrorUtils";
import { MBWAY_STATUS } from "@/types/shop/ifthenpay";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedUser();
    const user = session?.user;

    const body = (await req.json()) as Record<string, unknown>;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!phone)
      return NextResponse.json(
        { error: "Número de telemóvel MB WAY obrigatório." },
        { status: 400 }
      );

    const shiftId =
      typeof body?.shiftId === "string"
        ? body.shiftId.trim()
        : typeof body?.shift_id === "string"
          ? body.shift_id.trim()
          : null;

    const target = await resolvePaymentTarget(body, user, "mbway");
    if ("error" in target)
      return NextResponse.json({ error: target.error }, { status: target.statusCode });

    const { orderNumber, orderNumbers, totalAmount, customerEmail, redisSession } = target;

    if (!orderNumber || totalAmount <= 0)
      return NextResponse.json(
        { error: "O valor da encomenda deve ser superior a zero." },
        { status: 400 }
      );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    const notificationUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}/api/shop/mbway/webhook`
      : undefined;

    const paymentRes = await requestMbWayPayment({
      orderId: orderNumber,
      amount: totalAmount,
      phone,
      email: customerEmail || user?.email || undefined,
      description: `NEIIST ${orderNumber}`,
      notificationUrl,
    });

    if (paymentRes.Status !== MBWAY_STATUS.INIT_SUCCESS)
      return NextResponse.json(
        {
          error: paymentRes.Message || "Não foi possível iniciar o pagamento MB WAY.",
          code: paymentRes.Status,
        },
        { status: 400 }
      );

    if (redisSession) {
      const remainingSeconds = Math.max(1, getRemainingSessionSeconds(redisSession));
      await saveCheckoutSession(
        {
          ...redisSession,
          payment_method: "mbway",
          reference: paymentRes.RequestId,
        },
        remainingSeconds
      );
    }

    // Cache request mapping in Redis (TTL = 10 minutes)
    await saveMbWayCachedRequest({
      requestId: paymentRes.RequestId,
      orderNumber,
      orderNumbers,
      shiftId,
      totalAmount,
      phone: formatMbWayPhone(phone),
      status: "pending",
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      requestId: paymentRes.RequestId,
      orderNumber,
      amount: totalAmount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
