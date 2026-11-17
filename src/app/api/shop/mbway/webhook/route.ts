import { NextRequest, NextResponse } from "next/server";
import {
  getMbWayCachedRequest,
  handleMbWayStatusUpdate,
  verifyMbWayNotificationSignature,
} from "@/lib/payments/ifthenpay";
import type { MbWayNotificationPayload } from "@/types/shop/ifthenpay";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => null)) as MbWayNotificationPayload | null;
    if (!payload) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { RequestId, Status, Message } = payload;
    if (!RequestId) return NextResponse.json({ error: "Missing RequestId" }, { status: 400 });

    const cached = await getMbWayCachedRequest(RequestId);
    const orderNumber = cached?.orderNumber || null;
    const totalAmount = cached?.totalAmount ?? "0.00";

    const signature = req.headers.get("X-Ifthenpay-Signature");
    if (signature && orderNumber) {
      const isValid = verifyMbWayNotificationSignature(
        signature,
        orderNumber,
        totalAmount,
        RequestId
      );
      if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    await handleMbWayStatusUpdate({
      requestId: RequestId,
      statusCode: Status,
      verifiedBy: "ifthenpay-webhook",
      message: Message,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[MBWAY_WEBHOOK] Error processing notification:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
