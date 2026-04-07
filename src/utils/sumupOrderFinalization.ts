import { getOrderById, updateOrder, setOrderState } from "@/utils/dbUtils";
import { getOrderPaidTemplate, sendEmail } from "@/utils/emailUtils";
import { getStatusLabel } from "@/types/shop";

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

  //Update the order state to paid
  const statusUpdate = await setOrderState(orderId, "paid", paymentCheckedBy);
  if (!statusUpdate)
    return { success: false, error: "Failed to update order status", statusCode: 500 };

  //Add payment_reference (SumUp transaction id)
  const updateTransactionCode = await updateOrder(orderId, {
    payment_reference: reference,
  });
  if (!updateTransactionCode)
    return { success: false, error: "Failed to update payment reference", statusCode: 500 };

  if (statusUpdate.customer_email) {
    sendEmail({
      to: statusUpdate.customer_email,
      subject: `Encomenda ${statusUpdate.order_number} - ${getStatusLabel("paid")}`,
      html: getOrderPaidTemplate(
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
