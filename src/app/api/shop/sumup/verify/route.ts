import { NextRequest, NextResponse } from "next/server";
import SumUp from "@sumup/sdk";
import { getAllOrders, setOrderState, updateOrder } from "@/utils/dbUtils";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getOrderStatusUpdateTemplate } from "@/utils/emailUtils";
import { getStatusLabel } from "@/types/shop";
import type { Order } from "@/types/shop";
import { CheckoutData, SumUpClient } from "@/types/sumup";

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
    const body = await req.json();
    const { checkoutId, orderId } = body ?? {};

    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
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
      return NextResponse.json({
        ok: true,
        message: "Order already paid",
        alreadyProcessed: true,
      });
    }

    const client = createSumUpClient();
    if (!client) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }

    let checkoutData: CheckoutData;
    try {
      checkoutData = await client.checkouts.get(String(checkoutId));
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error: "Failed to verify payment with provider",
          details: formatError(err),
        },
        { status: 500 }
      );
    }

    const status = getStatus(checkoutData);
    const paid = isPaidStatus(status);

    if (!paid) {
      return NextResponse.json({
        ok: false,
        message: "Payment not completed",
        status,
      });
    }

    const checkoutRef =
      checkoutData?.checkout_reference ||
      checkoutData?.checkoutReference ||
      checkoutData?.checkout?.reference ||
      "";
    const expectedBase = `order-${orderId}`;

    if (checkoutRef && !String(checkoutRef).startsWith(expectedBase)) {
      return NextResponse.json(
        {
          error: "Invalid checkout reference",
          checkoutRef,
          expectedBase,
        },
        { status: 400 }
      );
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
    } catch (dbErr: unknown) {
      return NextResponse.json(
        {
          error: "Failed to update order",
          details: formatError(dbErr),
        },
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
        // intentionally ignore email send failures
      }
    }

    return NextResponse.json({
      ok: true,
      checkoutId,
      status,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: formatError(err),
      },
      { status: 500 }
    );
  }
}
