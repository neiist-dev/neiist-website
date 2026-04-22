import { getAllOrders, setOrderState } from "@/utils/dbUtils";
import { getAutoCancelledOrderEmailTemplate, sendEmail } from "@/utils/emailUtils";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import { Order } from "@/types/shop/order";
import { getStatusLabel } from "@/utils/shop/orderStatusUtils";

const AUTO_CANCEL_MS = 72 * 60 * 60 * 1000;

function isOlderThanThreshold(order: Order, now: number): boolean {
  const createdTs = new Date(order.created_at).getTime();
  if (!Number.isFinite(createdTs)) return false;

  return now - createdTs >= AUTO_CANCEL_MS;
}

export async function autoCancelPendingOrders() {
  const now = Date.now();

  const allOrders = (await getAllOrders()) as Order[];
  const candidates = allOrders.filter((order) => {
    if (order.status !== "pending" || !isOlderThanThreshold(order, now)) return false;

    const { orderKind } = getOrderKindFromItems(order.items);
    return getOrderKindRules(orderKind).autoCancelEnabled;
  });

  const cancelledOrderIds: number[] = [];
  const failedOrderIds: number[] = [];

  for (const order of candidates) {
    try {
      const updated = await setOrderState(order.id, "cancelled", "system-cron");
      if (!updated) {
        failedOrderIds.push(order.id);
        continue;
      }

      cancelledOrderIds.push(order.id);

      const { orderKind } = getOrderKindFromItems(order.items);
      const orderRules = getOrderKindRules(orderKind);

      if (order.customer_email && orderRules.customerEmailsEnabled) {
        try {
          await sendEmail({
            to: order.customer_email,
            subject: `Encomenda ${order.order_number} - ${getStatusLabel("cancelled")}`,
            html: getAutoCancelledOrderEmailTemplate(
              orderKind,
              order.order_number,
              order.customer_name,
              order.campus
            ),
          });
        } catch (mailError) {
          console.warn("auto-cancel: failed sending cancellation email", {
            orderId: order.id,
            error: mailError,
          });
        }
      }
    } catch (error) {
      console.error("auto-cancel: failed cancelling order", { orderId: order.id, error: error });
      failedOrderIds.push(order.id);
    }
  }

  return {
    success: true,
    checkedOrders: allOrders.length,
    matchedOrders: candidates.length,
    cancelledCount: cancelledOrderIds.length,
    failedCount: failedOrderIds.length,
    cancelledOrderIds,
    failedOrderIds,
  };
}
