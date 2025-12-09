import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, updateOrder, setOrderState } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getOrderStatusUpdateTemplate } from "@/utils/emailUtils";
import { getStatusLabel } from "@/types/shop";

const SUMUP_API_BASE = "https://api.sumup.com";

function isPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s.includes("processed") ||
    s.includes("paid") ||
    s.includes("completed") ||
    s.includes("success")
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { checkoutId, orderId } = body ?? {};
    if (!checkoutId) return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;
    const user = auth.user;

    const all = await getAllOrders();
    const order = all.find((o) => o.id === Number(orderId));
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.user_istid && user && order.user_istid !== user.istid) {
      return NextResponse.json({ error: "Not order owner" }, { status: 403 });
    }

    if (order.status === "paid" || order.status === "ready" || order.status === "delivered") {
      console.warn(`Order ${orderId} already processed with status: ${order.status}`);
      return NextResponse.json({
        ok: true,
        message: "Order already paid",
        alreadyProcessed: true,
      });
    }
    const SUMUP_ACCESS_TOKEN = process.env.SUMUP_ACCESS_TOKEN;
    if (!SUMUP_ACCESS_TOKEN)
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });

    const resp = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUMUP_ACCESS_TOKEN}`,
        Accept: "application/json",
      },
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("SumUp verify error:", data);
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
    const checkoutRef = data?.checkout_reference;
    if (checkoutRef && checkoutRef !== `order-${orderId}`) {
      console.error(`Checkout reference mismatch: ${checkoutRef} vs order-${orderId}`);
      return NextResponse.json({ error: "Invalid checkout" }, { status: 400 });
    }
    const sumupStatus =
      data?.status || data?.state || data?.transaction?.state || data?.payment?.state;
    const paid = isPaidStatus(String(sumupStatus));

    if (!paid) {
      return NextResponse.json({
        ok: false,
        message: "Payment not completed",
        status: sumupStatus,
      });
    }

    await updateOrder(Number(orderId), {
      payment_reference: checkoutId,
      paid_at: new Date().toISOString(),
      payment_checked_by: user?.istid ?? "system",
    });
    await setOrderState(Number(orderId), "paid", user?.istid ?? "system");

    if (order.customer_email) {
      const statusLabel = getStatusLabel("paid");
      await sendEmail({
        to: order.customer_email,
        subject: `Encomenda #${order.order_number} - ${statusLabel}`,
        html: getOrderStatusUpdateTemplate(
          order.order_number,
          order.customer_name,
          "paid",
          statusLabel
        ),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("sumup-verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
