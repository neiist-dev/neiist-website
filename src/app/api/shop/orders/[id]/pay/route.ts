import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/utils/dbUtils";
import { finalizePaidOrder } from "@/utils/shop/orderFinalization";
import { serverCheckRoles } from "@/utils/permissionUtils";
import { UserRole } from "@/types/user";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userRoles = await serverCheckRoles([
    UserRole._SHOP_MANAGER,
    UserRole._COORDINATOR,
    UserRole._ADMIN,
  ]);
  if (!userRoles.isAuthorized) return userRoles.error;

  try {
    const body = await request.json();
    const { paymentReference } = body;
    const orderId = Number((await params).id);

    if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    if (!paymentReference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const result = await finalizePaidOrder({
      orderId,
      paymentReference,
      paymentCheckedBy: userRoles.user!.istid,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    const updatedOrder = await getOrderById(orderId);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Order finalization error:", error);
    return NextResponse.json({ error: "Failed to finalize order" }, { status: 500 });
  }
}
