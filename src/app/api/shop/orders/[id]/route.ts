import { NextRequest, NextResponse } from "next/server";
import { updateOrder, setOrderState, getAllOrders as fetchAllOrders } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { OrderStatus } from "@/types/shop";
import { serverCheckRoles } from "@/utils/permissionUtils";
import type { User } from "@/types/user";
import type { Order } from "@/types/shop";

function isCoordinatorOrAbove(roles: UserRole[]) {
  return roles.includes(UserRole._ADMIN) || roles.includes(UserRole._COORDINATOR);
}

function isMemberOrAbove(roles: UserRole[]) {
  return isCoordinatorOrAbove(roles) || roles.includes(UserRole._MEMBER);
}

function isOrderOwner(order: Order, user: User) {
  return order.user_istid === user.istid;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([]); // authenticate and get user+roles
  if (!userRoles.isAuthorized) return userRoles.error;
  const { user, roles } = userRoles;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await fetchAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user!) && !isMemberOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const updates = await request.json();
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([UserRole._ADMIN, UserRole._COORDINATOR]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const { status } = await request.json();
  if (!status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  const updatedOrder = await setOrderState(orderId, status as OrderStatus, userRoles.user!.istid);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRoles = await serverCheckRoles([]); // authenticate
  if (!userRoles.isAuthorized) return userRoles.error;
  const { user, roles } = userRoles;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await fetchAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user!) && !isCoordinatorOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const updatedOrder = await setOrderState(orderId, "cancelled", user!.istid);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}
