import { getAllOrders, setOrderState } from "@/utils/dbUtils";
import { getOrderAutoCancelledTemplate, sendEmail } from "@/utils/emailUtils";
import { getStatusLabel, type Order } from "@/types/shop";

const AUTO_CANCEL_MS = 72 * 60 * 60 * 1000;

function isOlderThanThreshold(order: Order, now: number): boolean {
  const createdTs = new Date(order.created_at).getTime();
  if (!Number.isFinite(createdTs)) return false;

  return now - createdTs >= AUTO_CANCEL_MS;
}

export async function autoCancelPendingOrders() {
  const now = Date.now();

  const allOrders = (await getAllOrders()) as Order[];
  const candidates = allOrders.filter(
    (order) => order.status === "pending" && isOlderThanThreshold(order, now)
  );

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

      if (order.customer_email) {
        try {
          await sendEmail({
            to: order.customer_email,
            subject: `Encomenda ${order.order_number} - ${getStatusLabel("cancelled")}`,
            html: getOrderAutoCancelledTemplate(
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
