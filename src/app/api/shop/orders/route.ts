import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, newOrder, updateOrder } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getOrderConfirmationTemplate } from "@/utils/emailUtils";

const SUMUP_API_BASE = "https://api.sumup.com";
const SUMUP_ACCESS_TOKEN = process.env.SUMUP_ACCESS_TOKEN;

export async function GET() {
  const userRoles = await serverCheckRoles([UserRole._MEMBER]);
  if (!userRoles.isAuthorized) return userRoles.error;
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;
  try {
    const body = await request.json();
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }
    if (!userRoles.user) {
      return NextResponse.json({ error: "User information missing" }, { status: 500 });
    }
    const order = await newOrder({
      user_istid: body.user_istid,
      customer_name: body.customer_name ?? "",
      customer_email: body.customer_email ?? null,
      customer_phone: body.customer_phone ?? null,
      customer_nif: body.customer_nif ?? null,
      campus: body.campus ?? null,
      notes: body.notes ?? null,
      payment_method: body.payment_method ?? "in-person",
      payment_reference: body.payment_reference ?? null,
      items: body.items,
    });
    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    if (order.customer_email) {
      await sendEmail({
        to: order.customer_email,
        subject: `Encomenda #${order.order_number} Confirmada`,
        html: getOrderConfirmationTemplate(
          order.order_number,
          order.customer_name,
          order.items,
          order.total_amount,
          order.campus ?? undefined,
          order.payment_method ?? undefined
        ),
      });
    }
    if (body.payment_method === "sumup" || order.payment_method === "sumup") {
      try {
        if (!SUMUP_ACCESS_TOKEN) {
          console.warn("SUMUP_ACCESS_TOKEN not set; skipping SumUp checkout creation");
        } else {
          const amount = Number(order.total_amount ?? 0);
          if (!isNaN(amount) && amount > 0) {
            const amountCents = Math.round(amount * 100);
            const resp = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SUMUP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                amount: {
                  currency: body.currency ?? "EUR",
                  minor_unit: 2,
                  value: amountCents,
                },
                checkout_reference: `order-${order.id}`,
                description: `Pagamento encomenda ${order.id}`,
              }),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data && data.id) {
              await updateOrder(order.id, { payment_reference: data.id });
              order.payment_reference = data.id;
            } else {
              console.warn("SumUp checkout creation failed", data);
            }
          } else {
            console.warn(
              "Invalid order.total_amount, skipping SumUp checkout create",
              order.total_amount
            );
          }
        }
      } catch (err) {
        console.error("Error creating SumUp checkout for order", order.id, err);
      }
    }

    return NextResponse.json(order);
  } catch (e) {
    console.error("orders POST error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
