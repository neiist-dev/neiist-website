"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import styles from "@/styles/components/shop/MyOrdersList.module.css";
import { Order, Product } from "@/types/shop";
import { getCompactProductsSummary } from "@/utils/shopUtils";

type Props = { orders: Order[]; products: Product[] };

export default function MyOrdersList({ orders, products }: Props) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse<Order>(orders ?? [], {
        keys: ["order_number", "status", "items.product_name", "items.variant_label"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [orders]
  );

  const filtered = useMemo(() => {
    const list = orders ?? [];
    const q = query.trim();
    const results = q.length > 0 ? fuse.search(q).map((r) => r.item) : list;
    return results.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
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
    if (s.includes("pend") || s === "pending") return "Pendente";
    if (s.includes("paid") || s === "pago") return "Pago";
    if (s.includes("prepare") || s.includes("ready") || s === "preparing") return "Pronto";
    if (s.includes("deliver") || s.includes("entregue") || s === "delivered") return "Entregue";
    if (s.includes("cancel")) return "Cancelado";
    return status ?? "";
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

      <div className={styles.ordersGrid}>
        {filtered.length > 0 ? (
          filtered.map((order) => {
            const img = selectImage(order);
            const productSummary = getCompactProductsSummary(order.items).join(" · ");
            const statusLabel = order.delivered_at
              ? `Entregue em ${new Date(order.delivered_at).toLocaleDateString("pt-PT")}`
              : getStatusLabel(order.status);

            return (
              <Link
                key={order.id}
                href={`/my-orders?orderId=${order.id}`}
                className={styles.orderCard}
                aria-label={`Ver encomenda ${order.order_number}`}>
                <div className={styles.orderImageWrapper}>
                  <Image
                    src={img || "/images/neiist_logo.png"}
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
