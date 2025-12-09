import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, updateOrder } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";

const SUMUP_API_BASE = "https://api.sumup.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, currency = "EUR", checkout_reference } = body ?? {};
    if (!orderId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;

    const all = await getAllOrders();
    const order = all.find((o) => o.id === Number(orderId));
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.user_istid && auth.user && order.user_istid !== auth.user.istid) {
      return NextResponse.json({ error: "Not order owner" }, { status: 403 });
    }
    const expectedAmount = Math.round(Number(order.total_amount) * 100);
    if (amount !== expectedAmount) {
      console.error(
        `Amount mismatch: received ${amount}, expected ${expectedAmount} for order ${orderId}`
      );
      return NextResponse.json(
        {
          error: "Amount does not match order total",
        },
        { status: 400 }
      );
    }

    const SUMUP_ACCESS_TOKEN = process.env.SUMUP_ACCESS_TOKEN;
    if (!SUMUP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    const resp = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUMUP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency,
          minor_unit: 2,
          value: expectedAmount,
        },
        checkout_reference: checkout_reference ?? `order-${orderId}`,
        description: `Pagamento encomenda ${orderId}`,
      }),
    });

    const data: unknown = await resp.json();
    if (!resp.ok) {
      console.error("SumUp create checkout error:", data);
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
    }
    if (typeof data !== "object" || data === null || !("id" in data)) {
      return NextResponse.json({ error: "Invalid response from payment service" }, { status: 500 });
    }
    const checkoutId = (data as { id: string }).id;
    if (!checkoutId) {
      return NextResponse.json({ error: "Invalid response from payment service" }, { status: 500 });
    }

    await updateOrder(Number(orderId), { payment_reference: checkoutId });
    return NextResponse.json({ checkoutId });
  } catch (err) {
    console.error("create-sumup-checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
