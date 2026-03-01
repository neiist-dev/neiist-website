import { NextRequest, NextResponse } from "next/server";
import { updateOrder, setOrderState, getAllOrders, updateUser } from "@/utils/dbUtils";
import { UserRole } from "@/types/user";
import { getStatusLabel } from "@/types/shop";
import { serverCheckRoles } from "@/utils/permissionUtils";
import type { User } from "@/types/user";
import type { Order } from "@/types/shop";
import { getOrderStatusUpdateTemplate, sendEmail } from "@/utils/emailUtils";

function isShopManagerOrAbove(roles: UserRole[]) {
  return (
    roles.includes(UserRole._ADMIN) ||
    roles.includes(UserRole._COORDINATOR) ||
    roles.includes(UserRole._SHOP_MANAGER)
  );
}

function isOrderOwner(order: Order, user: User) {
  return order.user_istid === user.istid;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;
  const { user, roles } = userRoles;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await getAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user!) && !isShopManagerOrAbove(roles ?? [])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;
  const { user, roles } = userRoles;

  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const allOrders = await getAllOrders();
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const body = await request.json();

    const allowedFields = [
      "status",
      "delivered_at",
      "delivered_by",
      "notes",
      "payment_reference",
      "paid_at",
      "payment_checked_by",
      "campus",
      "nif",
      "items",
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) filteredUpdates[key] = body[key];
    }

    if (body.customer_nif !== undefined) filteredUpdates.nif = body.customer_nif;

    const phone = body.customer_phone !== undefined ? String(body.customer_phone ?? "") : undefined;

    if (Object.keys(filteredUpdates).length === 0 && phone === undefined) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const isAdminOrCoordinator =
      roles?.some((r) => [UserRole._ADMIN, UserRole._COORDINATOR].includes(r)) ?? false;

    const onlyNotes =
      Object.keys(filteredUpdates).length === 1 &&
      filteredUpdates.notes !== undefined &&
      phone === undefined;

    if (onlyNotes) {
      if (!isOrderOwner(order, user!) && !isAdminOrCoordinator) {
        return NextResponse.json(
          { error: "Insufficient permissions to edit notes" },
          { status: 403 }
        );
      }
    } else if (!isAdminOrCoordinator) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (filteredUpdates.items !== undefined) {
      if (!Array.isArray(filteredUpdates.items) || filteredUpdates.items.length === 0) {
        return NextResponse.json({ error: "Items must be a non-empty array" }, { status: 400 });
      }

      filteredUpdates.items = (filteredUpdates.items as Array<Record<string, unknown>>).map(
        (item, i) => {
          const productId = Number(item.product_id);
          const quantity = Number(item.quantity);
          const variantId =
            item.variant_id != null && String(item.variant_id) !== ""
              ? Number(item.variant_id)
              : null;

          if (!Number.isInteger(productId) || productId <= 0)
            throw new Error(`Item ${i + 1}: invalid product_id`);
          if (!Number.isInteger(quantity) || quantity <= 0)
            throw new Error(`Item ${i + 1}: invalid quantity`);
          if (variantId !== null && (!Number.isInteger(variantId) || variantId <= 0))
            throw new Error(`Item ${i + 1}: invalid variant_id`);

          return { product_id: productId, variant_id: variantId, quantity };
        }
      );
    }

    if (phone !== undefined && order.user_istid) {
      await updateUser(order.user_istid, { phone: phone || null });
    }

    const updatedOrder = await updateOrder(orderId, filteredUpdates as Partial<Order>);
    if (!updatedOrder) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
    return NextResponse.json(updatedOrder);
  } catch (e) {
    console.error("Order PUT error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([
    UserRole._SHOP_MANAGER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();
    const { status } = body;
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (!status) {
      return NextResponse.json({ error: "No status provided" }, { status: 400 });
    }

    const allOrders = await getAllOrders();
    const order = allOrders.find((o) => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    await setOrderState(orderId, status, userRoles.user?.istid ?? "system");

    if (order.customer_email) {
      const statusLabel = getStatusLabel(status);
      await sendEmail({
        to: order.customer_email,
        subject: `Encomenda #${order.order_number} - ${statusLabel}`,
        html: getOrderStatusUpdateTemplate(
          order.order_number,
          order.customer_name,
          status,
          statusLabel,
          order.campus
        ),
      });
    }
    const updatedOrders = await getAllOrders();
    const updatedOrder = updatedOrders.find((o) => o.id === orderId);

    return NextResponse.json(updatedOrder);
  } catch (e) {
    console.error("Order update error:", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userRoles = await serverCheckRoles([]);
  if (!userRoles.isAuthorized) return userRoles.error;
  const { user, roles } = userRoles;

  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const allOrders = await getAllOrders();
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (
    !isOrderOwner(order, user!) &&
    !roles?.some((r) => [UserRole._ADMIN, UserRole._COORDINATOR].includes(r))
  ) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const updatedOrder = await setOrderState(orderId, "cancelled", user!.istid);
  if (!updatedOrder) {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
  return NextResponse.json(updatedOrder);
}
