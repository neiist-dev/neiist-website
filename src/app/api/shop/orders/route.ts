import { NextRequest, NextResponse } from "next/server";
import {
  getAllOrders,
  newOrder,
  getUser,
  updateUser,
  mapOrderDbErrorToResponse,
} from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { sendEmail, getOrderConfirmationTemplate } from "@/utils/emailUtils";

export async function GET() {
  const userRoles = await serverCheckRoles([
    UserRole._SHOP_MANAGER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);
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
    const validPaymentMethods = new Set(["in-person", "eupago", "sumup", "apple-pay"]);

    if (!Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "No items in order" }, { status: 400 });

    if (typeof body.payment_method !== "string" || !validPaymentMethods.has(body.payment_method)) {
      return NextResponse.json({ error: "Missing or invalid payment_method" }, { status: 400 });
    }

    if (!userRoles.user)
      return NextResponse.json({ error: "User information missing" }, { status: 500 });

    const stockOverride =
      (userRoles.roles?.includes(UserRole._ADMIN) ?? false) && body.stock_override === true;

    const order = await newOrder(
      {
        user_istid: body.user_istid,
        customer_name: body.customer_name ?? "",
        customer_email: body.customer_email ?? null,
        customer_phone: body.customer_phone ?? null,
        customer_nif: body.customer_nif ?? null,
        campus: body.campus ?? null,
        notes: body.notes ?? null,
        payment_method: body.payment_method,
        payment_reference: body.payment_reference ?? "",
        created_by: userRoles.user.istid,
        items: body.items,
      },
      stockOverride
    );
    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    if (body.customer_phone && body.user_istid) {
      const user = await getUser(body.user_istid);
      if (user && user.phone !== body.customer_phone) {
        await updateUser(body.user_istid, { phone: body.customer_phone });
      }
    }

    if (order.customer_email) {
      try {
        await sendEmail({
          to: order.customer_email,
          subject: `Encomenda #${order.order_number} Pendente`,
          html: getOrderConfirmationTemplate(
            order.order_number,
            order.customer_name,
            order.items,
            order.total_amount,
            order.campus ?? undefined,
            order.payment_method ?? undefined
          ),
        });
      } catch (emailErr) {
        console.warn("Failed to send order confirmation email:", emailErr);
      }
    }

    return NextResponse.json(order);
  } catch (e) {
    const mappedError = mapOrderDbErrorToResponse(e);
    if (mappedError) {
      return NextResponse.json({ error: mappedError.error }, { status: mappedError.status });
    }

    console.error("orders POST error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
