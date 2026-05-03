import { getOrderById, updateOrder, setOrderState, signUpToEvent } from "@/utils/dbUtils";
import { getPaidOrderEmailTemplate, sendEmail } from "@/utils/emailUtils";
import { Order } from "@/types/shop/order";
import { getOrderKindRules } from "@/utils/shop/orderKindUtils";
import { getStatusLabel } from "@/utils/shop/orderStatusUtils";
import { getOrderKindFromItems } from "@/utils/shop/orderKindUtils";

const AFTER_PURCHASE_ACTIONS = {
  register_jantar_de_curso: async (order: Order) => {
    const activityId = process.env.NEXT_PUBLIC_JANTAR_DE_CURSO_ACTIVITY_ID;
    if (!activityId || !order.user_istid) return;

    await signUpToEvent(activityId, order.user_istid);
  },
} as const;

export type FinalizePaidOrderResult =
  | { success: true; alreadyProcessed?: boolean }
  | { success: false; error: string; statusCode: number };

export async function finalizePaidOrder({
  orderId,
  paymentReference,
  paymentCheckedBy,
}: {
  orderId: number;
  paymentReference: string;
  paymentCheckedBy: string;
}): Promise<FinalizePaidOrderResult> {
  const order = await getOrderById(orderId);
  if (!order) return { success: false, error: "Order not found", statusCode: 404 };

  if (["paid", "ready", "delivered"].includes(order.status))
    return { success: true, alreadyProcessed: true };

  const reference = String(paymentReference ?? "").trim();
  if (!reference) return { success: false, error: "Missing payment reference", statusCode: 400 };

  const statusUpdate = await setOrderState(orderId, "paid", paymentCheckedBy);
  if (!statusUpdate)
    return { success: false, error: "Failed to update order status", statusCode: 500 };

  if (statusUpdate.payment_method !== "cash") {
    const updateTransactionCode = await updateOrder(orderId, {
      payment_reference: reference,
    });
    if (!updateTransactionCode)
      return { success: false, error: "Failed to update payment reference", statusCode: 500 };
  }

  const { orderKind } = getOrderKindFromItems(statusUpdate.items);
  const orderRules = getOrderKindRules(orderKind, "other");
  const afterPurchaseActionKey = orderRules.afterPurchaseActionKey;

  if (afterPurchaseActionKey) {
    try {
      await AFTER_PURCHASE_ACTIONS[afterPurchaseActionKey](statusUpdate);
    } catch (error) {
      console.warn("Failed to perform after purchase action", {
        orderId,
        error,
      });
    }
  }

  if (statusUpdate.customer_email && orderRules.customerEmailsEnabled) {
    sendEmail({
      to: statusUpdate.customer_email,
      subject: `Encomenda ${statusUpdate.order_number} - ${getStatusLabel("paid")}`,
      html: getPaidOrderEmailTemplate(
        orderKind,
        statusUpdate.order_number,
        statusUpdate.customer_name,
        statusUpdate.items,
        Number(statusUpdate.total_amount),
        statusUpdate.campus,
        statusUpdate.payment_method,
        reference
      ),
    }).catch((err) => console.warn("Confirmation couldn't be sent:", err));
  }

  return { success: true };
}
