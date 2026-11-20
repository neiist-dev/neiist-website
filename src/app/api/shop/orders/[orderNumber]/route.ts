import { NextRequest, NextResponse } from "next/server";
import { type User } from "@/types/user";
import { Order } from "@/types/shop/order";
import { getOrderByNumber } from "@/lib/db/repositories/shop.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";

function isOrderOwner(order: Order, user: User) {
  return order.user_istid === user.istid;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber?: string; id?: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { user } = session;
  const p = await params;
  const identifier = p.orderNumber || p.id;
  if (!identifier) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const order = await getOrderByNumber(identifier);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user) && !hasPermission(user, "orders:read"))
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  return NextResponse.json(order);
}
