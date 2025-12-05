import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, newOrder } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { serverCheckRoles } from "@/utils/permissionUtils";

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
  const userRoles = await serverCheckRoles([]); // authenticate (guest)
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
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
