"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/MyOrdersList.module.css";
import { Order } from "@/types/shop/order";
import { Product } from "@/types/shop/product";
import { getCompactProductsSummary } from "@/utils/shop/shopUtils";
import { getOrderKindFromItems, getOrderStatusLabelForKind } from "@/utils/shop/orderKindUtils";

type Props = { orders: Order[]; products: Product[] };

export default function MyOrdersList({ orders, products }: Props) {
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span className={styles.primary}>As mi</span>
        <span className={styles.secondary}>nhas en</span>
        <span className={styles.tertiary}>come</span>
        <span className={styles.quaternary}>ndas</span>
      </h1>

      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Procurar número, produto, estado ou data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Pesquisar encomendas"
          />
        </div>
      </div>

      {anyDeadlineNear && (
        <div className={styles.deadlineBanner} role="status">
          Atenção: tens pelo menos uma encomenda com prazo de levantamento próximo.
        </div>
      )}

      <div className={styles.ordersGrid}>
        {filtered.length > 0 ? (
          filtered.map((order) => {
            const img = selectImage(order);
            const productSummary = getCompactProductsSummary(order.items).join(" · ");
            const orderKind = getOrderKindFromItems(order.items).orderKind;
            const statusLabel = order.delivered_at
              ? `Entregue em ${new Date(order.delivered_at).toLocaleDateString("pt-PT")}`
              : getOrderStatusLabelForKind(orderKind, order.status);

            return (
              <Link
                key={order.id}
                href={`/my-orders?orderId=${order.id}`}
                className={styles.orderCard}
                aria-label={`Ver encomenda ${order.order_number}`}>
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
            <p>Nenhuma encomenda encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
