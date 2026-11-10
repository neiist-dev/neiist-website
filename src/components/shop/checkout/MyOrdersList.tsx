"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LuClock } from "react-icons/lu";
import styles from "@/styles/components/shop/checkout/MyOrdersList.module.css";
import { Order } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { getCompactProductsSummary, findItemVariant, getItemImage } from "@/utils/shop/shopUtils";
import { getLocalizedOrderStatusLabel } from "@/utils/shop/orderStatusUtils";
import { ColorfulText, SearchInput } from "@neiist/ui";
import { useSearch } from "@/hooks/useSearch";
import type { Dictionary } from "@/i18n/dictionaries";

interface MyOrdersListProps {
  orders: Order[];
  products: Product[];
  dict: Dictionary["my_orders"];
  basePath?: string;
}

export default function MyOrdersList({ orders, products, dict, basePath }: MyOrdersListProps) {
  const anyDeadlineNear = useMemo(() => {
    if (!orders || orders.length === 0) return false;
    const now = new Date();
    return orders.some((order) => {
      if (!order.pickup_deadline || order.status === "delivered" || order.status === "cancelled")
        return false;
      const deadline = new Date(order.pickup_deadline);
      const diffDays = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 28 && diffDays >= 0;
    });
  }, [orders]);

  const sortedOrders = useMemo(
    () => (orders ?? []).slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [orders]
  );

  const {
    results: filtered,
    query,
    setQuery,
  } = useSearch<Order>({
    data: sortedOrders,
    fields: [{ field: "order_number", boost: 4 }, { field: "status", boost: 3 }, "itemsText"],
    extractField: (order, field) => {
      if (field === "itemsText")
        return order.items?.map((i) => `${i.product_name} ${i.variant_label || ""}`).join(" ");

      return undefined;
    },
    returnAllWhenEmpty: true,
  });

  const selectImage = (order: Order): string | undefined => {
    if (!order.items || order.items.length === 0) return undefined;
    const firstItem = order.items[0];
    const product = products.find((product) => String(product.id) === String(firstItem.product_id));

    if (!product) return undefined;
    const variantObj = findItemVariant(product, {
      variant_id: firstItem.variant_id,
      variant_options: firstItem.variant_options,
    });
    return getItemImage(product, variantObj) ?? undefined;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ColorfulText as="h1" className={styles.title} text={dict.title} />
        {dict.subtitle && <p className={styles.subtitle}>{dict.subtitle}</p>}
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <SearchInput
            placeholder={dict.search_placeholder}
            value={query}
            onChange={setQuery}
            aria-label={dict.search_aria_label}
          />
        </div>
      </div>

      {anyDeadlineNear && (
        <div className={styles.deadlineBanner} role="status">
          {dict.deadline_banner}
        </div>
      )}

      <div className={styles.ordersGrid}>
        {filtered.length > 0 ? (
          filtered.map((order) => {
            const img = selectImage(order);
            const productSummary = getCompactProductsSummary(order.items).join(" · ");
            const statusLabel = getLocalizedOrderStatusLabel(order, {
              status: dict.status,
              delivered_on: dict.delivered_on,
              ticket_confirmed: dict.ticket_confirmed,
            });

            return (
              <div key={order.order_number} className={styles.orderCard}>
                <Link
                  href={`${basePath || ""}/my-orders?orderId=${order.order_number}`}
                  scroll={false}
                  className={styles.orderCardLink}
                  aria-label={dict.order_aria_label.replace(
                    "{number}",
                    String(order.order_number)
                  )}>
                  <div className={styles.orderImageWrapper}>
                    <Image
                      src={img || "/default_user.png"}
                      alt={productSummary || `Order ${order.order_number}`}
                      width={367}
                      height={485}
                      className={styles.orderImage}
                    />
                  </div>

                  <div className={styles.orderInfo}>
                    <div className={styles.orderProduct}>{productSummary}</div>
                    <div className={styles.orderStatus}>{statusLabel}</div>
                    {order.pickup_deadline &&
                      order.status !== "delivered" &&
                      order.status !== "cancelled" && (
                        <span className={styles.deadlineTag}>
                          <LuClock size={12} />
                          {dict.pickup_deadline_tag.replace(
                            "{date}",
                            new Date(order.pickup_deadline).toLocaleDateString("pt-PT")
                          )}
                        </span>
                      )}
                  </div>
                </Link>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p>{dict.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}
