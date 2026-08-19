import { getAutoCancelledOrderEmailTemplate, sendEmail } from "@/lib/email";
import { getOrderKindRules, getOrderKindFromItems } from "@/utils/shop/orderKindUtils";
import { getStatusLabel } from "@/utils/shop/orderStatusUtils";
import {
  getStalePendingOrders,
  cancelOrderBackground,
} from "@/lib/db/repositories/shop.repository";

const AUTO_CANCEL_MS = 72 * 60 * 60 * 1000;

export async function autoCancelPendingOrders() {
  const staleOrders = await getStalePendingOrders(AUTO_CANCEL_MS);
  const candidates = staleOrders.filter((order) => {
    const { orderKind } = getOrderKindFromItems(order.items);
    return getOrderKindRules(orderKind).autoCancelEnabled;
  });

  const cancelledOrderIds: number[] = [];
  const failedOrderIds: number[] = [];

  for (const order of candidates) {
    try {
      const updated = await cancelOrderBackground(order.id);
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
    checkedOrders: staleOrders.length,
    matchedOrders: candidates.length,
    cancelledCount: cancelledOrderIds.length,
    failedCount: failedOrderIds.length,
    cancelledOrderIds,
    failedOrderIds,
  };
}
