"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/components/shop/MyOrdersList.module.css";
import { Order } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { getCompactProductsSummary } from "@/utils/shop/shopUtils";
import { getOrderKindFromItems, getLocalizedOrderStatusLabel } from "@/utils/shop/orderKindUtils";
import ColorfulText from "@/components/ColorfulText";
import Search from "@/components/search/Search";
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
    return orders.some((o) => {
      if (!o.pickup_deadline) return false;
      const deadline = new Date(o.pickup_deadline);
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
      if (field === "itemsText") {
        return order.items?.map((i) => `${i.product_name} ${i.variant_label || ""}`).join(" ");
      }
      return undefined;
    },
    returnAllWhenEmpty: true,
  });

  const selectImage = (order: Order): string | undefined => {
    if (!order.items || order.items.length === 0) return undefined;
    const firstItem = order.items[0];
    const product = products.find((p) => String(p.id) === String(firstItem.product_id));
    if (!product) return undefined;
    const variantObj = firstItem.variant_id
      ? product.variants?.find((v) => String(v.id) === String(firstItem.variant_id))
      : undefined;
    return variantObj?.images?.[0] ?? product.images?.[0];
  };

  return (
    <div className={styles.container}>
      <ColorfulText as="h1" className={styles.title} text={dict.title} />

      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search
            className={styles.searchInput}
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
            const orderKind = getOrderKindFromItems(order.items).orderKind;
            const statusLabel = getLocalizedOrderStatusLabel(orderKind, order, {
              status: dict.status,
              delivered_on: dict.delivered_on,
              special_status: dict.special_status,
            });

            return (
              <Link
                key={order.id}
                href={`${basePath || ""}/my-orders?orderId=${order.id}`}
                className={styles.orderCard}
                aria-label={dict.order_aria_label.replace("{number}", String(order.order_number))}>
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
                  <div className={styles.orderStatus}>{statusLabel}</div>
                  <div className={styles.orderProduct}>{productSummary}</div>
                </div>
              </Link>
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
