import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/utils/apiErrorUtils";
import { type User } from "@/types/user";
import {
  getOrderKindRules,
  getOrderKindFromItems,
  canTransitionOrderStatus,
} from "@/utils/shop/orderKindUtils";
import { getStatusLabel } from "@/utils/shop/orderStatusUtils";
import { isValidPaymentMethod } from "@/types/shop/payment";
import { Order } from "@/types/shop/order";
import {
  getPendingOrderEmailTemplate,
  getStatusUpdateOrderEmailTemplate,
  sendEmail,
} from "@/lib/email";
import {
  updateOrder,
  setOrderState,
  getOrderById,
  getOrderByIdOrNumber,
} from "@/lib/db/repositories/shop.repository";
import { getAuthenticatedUser } from "@/lib/auth";
import { hasPermission } from "@/lib/security/permissions";
import { revalidatePath } from "next/cache";

function isOrderOwner(order: Order, user: User) {
  return order.user_istid === user.istid;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { user } = session;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const order = await getOrderByIdOrNumber(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (!isOrderOwner(order, user) && !hasPermission(user, "orders:read"))
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { user } = session;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const order = await getOrderByIdOrNumber(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const orderId = order.id;

  const body = await request.json();

  try {
    const allowedFields = [
      "status",
      "payment_method",
      "delivered_at",
      "delivered_by",
      "notes",
      "payment_reference",
      "created_by",
      "paid_at",
      "payment_checked_by",
      "pickup_deadline",
      "campus",
      "nif",
      "items",
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) filteredUpdates[key] = body[key];
    }

    if (body.customer_nif !== undefined) filteredUpdates.nif = body.customer_nif;

    if (Object.keys(filteredUpdates).length === 0)
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

    const canShopOps = hasPermission(user, "orders:write");

    const onlyNotes =
      Object.keys(filteredUpdates).length === 1 && filteredUpdates.notes !== undefined;
    const onlyInPersonSwitch =
      Object.keys(filteredUpdates).length === 1 && filteredUpdates.payment_method === "in-person";

    if (onlyNotes) {
      if (!isOrderOwner(order, user) && !canShopOps) {
        return NextResponse.json(
          { error: "Insufficient permissions to edit notes" },
          { status: 403 }
        );
      }
    } else if (onlyInPersonSwitch) {
      if (!isOrderOwner(order, user) && !canShopOps) {
        return NextResponse.json(
          { error: "Insufficient permissions to switch payment method" },
          { status: 403 }
        );
      }

      if (order.status !== "pending") {
        return NextResponse.json(
          { error: "Payment method can only be changed while order is pending" },
          { status: 400 }
        );
      }

      filteredUpdates.payment_reference = "";
    } else if (!canShopOps) {
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

    if (filteredUpdates.payment_method !== undefined) {
      if (!isValidPaymentMethod(filteredUpdates.payment_method))
        return NextResponse.json({ error: "Invalid payment_method" }, { status: 400 });
    }

    const stockOverride = hasPermission(user, "orders:override") && body.stock_override === true;

    const updatedOrder = await updateOrder(
      orderId,
      filteredUpdates as Partial<Order>,
      stockOverride,
      user?.istid ?? "system"
    );
    if (!updatedOrder)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });

    if (onlyInPersonSwitch && updatedOrder.customer_email) {
      if (
        !getOrderKindRules(getOrderKindFromItems(updatedOrder.items).orderKind)
          .customerEmailsEnabled
      ) {
        return NextResponse.json(updatedOrder);
      }

      try {
        await sendEmail({
          to: updatedOrder.customer_email,
          subject: `Encomenda ${updatedOrder.order_number} - Pendente`,
          html: getPendingOrderEmailTemplate(
            getOrderKindFromItems(updatedOrder.items).orderKind,
            updatedOrder.order_number,
            updatedOrder.customer_name,
            updatedOrder.items,
            Number(updatedOrder.total_amount),
            updatedOrder.campus ?? undefined,
            "in-person",
            updatedOrder.pickup_deadline ?? null,
            updatedOrder.id
          ),
        });
      } catch (emailErr) {
        console.warn("Failed to send pending email after in-person fallback", emailErr);
      }
    }

    revalidatePath("/orders");
    revalidatePath("/my-orders");
    return NextResponse.json(updatedOrder);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Item "))
      return NextResponse.json({ error: error.message }, { status: 400 });

    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { user } = session;

  if (!hasPermission(user, "orders:write"))
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const body = await request.json();
  const { status } = body;
  if (!status) return NextResponse.json({ error: "No status provided" }, { status: 400 });

  if (status === "paid")
    return NextResponse.json({ error: "Use POST /pay to mark order as paid" }, { status: 400 });

  const order = await getOrderByIdOrNumber(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const orderId = order.id;

  const { orderKind } = getOrderKindFromItems(order.items);
  if (!canTransitionOrderStatus(orderKind, order.status, status)) {
    return NextResponse.json(
      { error: `Transição de estado inválida: de ${order.status} para ${status}` },
      { status: 400 }
    );
  }

  try {
    await setOrderState(orderId, status, user.istid);
    const updatedOrder = await getOrderById(orderId);

    if (updatedOrder?.customer_email) {
      const statusLabel = getStatusLabel(status);
      const orderKindRules = getOrderKindRules(getOrderKindFromItems(updatedOrder.items).orderKind);

      if (orderKindRules.customerEmailsEnabled) {
        await sendEmail({
          to: updatedOrder.customer_email,
          subject: `Encomenda ${updatedOrder.order_number} - ${statusLabel}`,
          html: getStatusUpdateOrderEmailTemplate(
            getOrderKindFromItems(updatedOrder.items).orderKind,
            updatedOrder.order_number,
            updatedOrder.customer_name,
            status,
            statusLabel,
            updatedOrder.campus
          ),
        });
      }
    }

    revalidatePath("/orders");
    revalidatePath("/my-orders");
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedUser();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { user } = session;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const order = await getOrderByIdOrNumber(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const orderId = order.id;

  if (!isOrderOwner(order, user) && !hasPermission(user, "orders:delete"))
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

  const updatedOrder = await setOrderState(orderId, "cancelled", user.istid);
  if (!updatedOrder) return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });

  revalidatePath("/orders");
  revalidatePath("/my-orders");
  return NextResponse.json(updatedOrder);
}
