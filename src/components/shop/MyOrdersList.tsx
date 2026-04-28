"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/MyOrdersList.module.css";
import { Order, Product } from "@/types/shop";
import { getCompactProductsSummary } from "@/utils/shopUtils";

type Dict = {
  title_letters: string[];
  search_placeholder: string;
  search_aria_label: string;
  deadline_banner: string;
  delivered_on: string;
  order_aria_label: string;
  empty: string;
  status: {
    pending: string;
    paid: string;
    ready: string;
    delivered: string;
    cancelled: string;
  };
};

type Props = { orders: Order[]; products: Product[]; dict: Dict };

export default function MyOrdersList({ orders, products, dict }: Props) {
  const [query, setQuery] = useState("");
  const anyDeadlineNear = useMemo(() => {
    if (!orders || orders.length === 0) return false;
    const now = new Date();
    return orders.some((o) => {
      if (!o.pickup_deadline) return false;
      const dl = new Date(o.pickup_deadline);
      const diffDays = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 28 && diffDays >= 0;
    });
  }, [orders]);

  const fuse = useMemo(
    () =>
      new Fuse<Order>(orders ?? [], {
        keys: [
          { name: "order_number", weight: 4 },
          { name: "status", weight: 3 },
          { name: "items.product_name", weight: 2 },
          { name: "items.variant_label", weight: 1 },
        ],
        threshold: 0.23,
        ignoreLocation: true,
        minMatchCharLength: 2,
        shouldSort: true,
      }),
    [orders]
  );

  const filtered = useMemo(() => {
    const list = orders ?? [];
    const searchQuery = query.trim();
    if (!searchQuery) {
      return list.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }

    const queryLower = searchQuery.toLowerCase();
    const exactMatches = list.filter(
      (order) =>
        String(order.order_number).toLowerCase().includes(queryLower) ||
        String(order.status).toLowerCase().includes(queryLower)
    );

    const fuseResults = fuse.search(searchQuery).map((r) => r.item);

    const seen = new Set(exactMatches.map((o) => o.id));
    const combined = [...exactMatches, ...fuseResults.filter((o) => !seen.has(o.id))];

    return combined.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [orders, query, fuse]);

  const selectImage = (order: Order): string | undefined => {
    if (!order.items || order.items.length === 0) return undefined;
    const firstItem = order.items[0];
    const product = products.find((p) => p.id === firstItem.product_id);
    if (!product) return undefined;
    const variantObj = firstItem.variant_id
      ? product.variants?.find((v) => v.id === firstItem.variant_id)
      : undefined;
    if (variantObj && Array.isArray(variantObj.images) && variantObj.images.length > 0) {
      return variantObj.images[0];
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return undefined;
  };

  const getStatusLabel = (status?: string) => {
    const s = (status ?? "").toLowerCase();
    if (s.includes("pend") || s === "pending") return dict.status.pending;
    if (s.includes("paid") || s === "pago") return dict.status.paid;
    if (s.includes("prepare") || s.includes("ready") || s === "preparing") return dict.status.ready;
    if (s.includes("deliver") || s.includes("entregue") || s === "delivered") return dict.status.delivered;
    if (s.includes("cancel")) return dict.status.cancelled;
    return status ?? "";
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.primary}>{dict.title_letters[0]}</span>
        <span className={styles.secondary}>{dict.title_letters[1]}</span>
        <span className={styles.tertiary}>{dict.title_letters[2]}</span>
        <span className={styles.quaternary}>{dict.title_letters[3]}</span>
      </h1>

      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder={dict.search_placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
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
            const statusLabel = order.delivered_at
              ? dict.delivered_on.replace("{date}", new Date(order.delivered_at).toLocaleDateString("pt-PT"))
              : getStatusLabel(order.status);

            return (
              <Link
                key={order.id}
                href={`/my-orders?orderId=${order.id}`}
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
