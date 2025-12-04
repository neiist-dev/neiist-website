import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUser,
  updateOrder,
  setOrderState,
  getAllOrders as fetchAllOrders,
} from "@/utils/dbUtils";
import { UserRole, mapRoleToUserRole } from "@/types/user";
import { OrderStatus } from "@/types/shop";
import type { User } from "@/types/user";
import type { Order } from "@/types/shop";

async function getCurrentUserAndRoles() {
  const accessToken = (await cookies()).get("access_token")?.value;
  if (!accessToken) return null;
  const userData = JSON.parse((await cookies()).get("user_data")?.value || "null");
  if (!userData) return null;
  const user = await getUser(userData.istid);
  if (!user) return null;
  const roles = user.roles?.map(mapRoleToUserRole) || [UserRole._GUEST];
  return { user, roles };
}

function isCoordinatorOrAbove(roles: UserRole[]) {
  return roles.includes(UserRole._ADMIN) || roles.includes(UserRole._COORDINATOR);
}

function isMemberOrAbove(roles: UserRole[]) {
  return isCoordinatorOrAbove(roles) || roles.includes(UserRole._MEMBER);
}

function isOrderOwner(order: Order, user: User) {
  return order.user_istid === user.istid;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, roles } = (await getCurrentUserAndRoles()) || {};
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await fetchAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user) && !isMemberOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, roles } = (await getCurrentUserAndRoles()) || {};
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!isCoordinatorOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const updates = await req.json();
  const allowedFields = [
    "status",
    "delivered_at",
    "delivered_by",
    "notes",
    "payment_reference",
    "paid_at",
    "payment_checked_by",
    "campus",
  ];
  const filteredUpdates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) filteredUpdates[key] = updates[key];
  }

  const updatedOrder = await updateOrder(orderId, filteredUpdates);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, roles } = (await getCurrentUserAndRoles()) || {};
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!isCoordinatorOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  const updatedOrder = await setOrderState(orderId, status as OrderStatus, user.istid);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, roles } = (await getCurrentUserAndRoles()) || {};
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await fetchAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user) && !isCoordinatorOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const updatedOrder = await setOrderState(orderId, "cancelled", user.istid);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}
