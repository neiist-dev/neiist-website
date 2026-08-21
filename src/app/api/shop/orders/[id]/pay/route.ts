import { NextRequest, NextResponse } from "next/server";
import { finalizePaidOrder } from "@/utils/shop/orderFinalization";
import { UserRole } from "@/types/user";
import { getOrderById, getOrderByIdOrNumber } from "@/lib/db/repositories/shop.repository";
import { serverCheckRoles } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { handleApiError } from "@/utils/apiErrorUtils";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([
    UserRole._SHOP_MANAGER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);
  if (!userRoles.isAuthorized) return userRoles.error;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Invalid order identifier" }, { status: 400 });

  const body = await request.json();
  const { paymentReference } = body;
  if (!paymentReference)
    return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });

  const order = await getOrderByIdOrNumber(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const orderId = order.id;

  try {
    const result = await finalizePaidOrder({
      orderId,
      paymentReference,
      paymentCheckedBy: userRoles.user!.istid,
    });

    if (!result.success)
      return NextResponse.json({ error: result.error }, { status: result.statusCode });

    const updatedOrder = await getOrderById(orderId);
    revalidatePath("/orders");
    revalidatePath("/my-orders");

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return handleApiError(error);
  }
}
