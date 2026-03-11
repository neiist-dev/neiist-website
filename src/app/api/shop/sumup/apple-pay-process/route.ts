import { NextRequest, NextResponse } from "next/server";
import SumUp from "@sumup/sdk";
import { getAllOrders, setOrderState, updateOrder } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getOrderStatusUpdateTemplate } from "@/utils/emailUtils";
import { getStatusLabel } from "@/types/shop";
import type { Order } from "@/types/shop";
import type { ApplePayPaymentToken, CheckoutData, SumUpClient } from "@/types/sumup";

const SUMUP_API_KEY = process.env.SUMUP_API_KEY;

function createSumUpClient(): SumUpClient | null {
  if (!SUMUP_API_KEY) return null;
  return new SumUp({ apiKey: SUMUP_API_KEY }) as SumUpClient;
}

function getStatus(data: CheckoutData): string {
  return (
    data?.status ||
    data?.state ||
    data?.transaction?.status ||
    data?.transaction?.state ||
    data?.payment?.status ||
    data?.payment?.state ||
    ""
  );
}

function isPaidStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (
    s.includes("paid") ||
    s.includes("successful") ||
    s.includes("completed") ||
    s.includes("success")
  );
}

function formatError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      checkoutId?: string;
      orderId?: number | string;
      applePayToken?: ApplePayPaymentToken;
    };
    const { checkoutId, orderId, applePayToken } = body ?? {};

    if (!checkoutId || !orderId || !applePayToken) {
      return NextResponse.json(
        { error: "Missing checkoutId, orderId, or applePayToken" },
        { status: 400 }
      );
    }

    const auth = await serverCheckRoles([]);
    if (!auth.isAuthorized) return auth.error;
    const user = auth.user;

    const allOrders = (await getAllOrders()) as Order[];
    const order = allOrders.find((o) => o.id === Number(orderId));
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_istid && user && order.user_istid !== user.istid) {
      return NextResponse.json({ error: "Not order owner" }, { status: 403 });
    }

    if (["paid", "ready", "delivered"].includes(order.status)) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    if (!SUMUP_API_KEY) {
      return NextResponse.json({ error: "Payment service misconfigured" }, { status: 500 });
    }

    // Submit Apple Pay token to SumUp to process the checkout
    const processRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${SUMUP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "apple_pay",
        id: checkoutId,
        amount: Number(order.total_amount),
        currency: "EUR",
        apple_pay: { token: applePayToken },
      }),
    });

    if (!processRes.ok) {
      const errText = await processRes.text();
      console.error("SumUp Apple Pay process error:", errText);
      return NextResponse.json(
        { error: "Payment processing failed" },
        { status: processRes.status }
      );
    }

    // Verify payment status via SDK
    const client = createSumUpClient();
    if (!client) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    let checkoutData: CheckoutData;
    try {
      checkoutData = await client.checkouts.get(String(checkoutId));
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to verify payment", details: formatError(err) },
        { status: 500 }
      );
    }

    const status = getStatus(checkoutData);
    if (!isPaidStatus(status)) {
      return NextResponse.json({ ok: false, status }, { status: 402 });
    }

    const checkoutRef =
      checkoutData?.checkout_reference ||
      checkoutData?.checkoutReference ||
      checkoutData?.checkout?.reference ||
      "";
    if (checkoutRef && !String(checkoutRef).startsWith(`order-${orderId}`)) {
      return NextResponse.json({ error: "Checkout reference mismatch" }, { status: 400 });
    }

    const paidAt = new Date().toISOString();
    try {
      await updateOrder(Number(orderId), {
        payment_reference: checkoutId,
        paid_at: paidAt,
        payment_checked_by: user?.istid ?? "system",
        updated_at: paidAt,
        status: "paid",
      });
      await setOrderState(Number(orderId), "paid", user?.istid ?? "system");
    } catch (dbErr) {
      return NextResponse.json(
        { error: "Failed to update order", details: formatError(dbErr) },
        { status: 500 }
      );
    }

    if (order.customer_email) {
      try {
        const statusLabel = getStatusLabel("paid");
        await sendEmail({
          to: order.customer_email,
          subject: `Encomenda #${order.order_number} - ${statusLabel}`,
          html: getOrderStatusUpdateTemplate(
            order.order_number,
            order.customer_name,
            "paid",
            statusLabel,
            order.campus
          ),
        });
      } catch {
        // intentionally ignore email failures
      }
    }

    return NextResponse.json({ ok: true, checkoutId, status });
  } catch (err) {
    console.error("apple-pay-process route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
