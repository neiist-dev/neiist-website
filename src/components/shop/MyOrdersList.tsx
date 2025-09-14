"use client";

import styles from "@/styles/components/shop/MyOrdersList.module.css";
import { Order } from "@/types/shop";
import Link from "next/link";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import Fuse from "fuse.js";
import { getCompactProductsSummary } from "@/utils/shopUtils";
import { useMemo, useState } from "react";

export default function MyOrdersList({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [hideCancelled, setHideCancelled] = useState(true);

  const fuse = useMemo(() => {
    return new Fuse<Order>(orders ?? [], {
      keys: [
        "order_number",
        "status",
        "items.product_name",
        "items.variant_label",
        {
          name: "items.variant_options",
          getFn: (order: Order) =>
            order.items.map((i) => Object.values(i.variant_options || {}).join(" ")).join(" "),
        },
        {
          name: "created_at_date",
          getFn: (order: Order) => new Date(order.created_at).toLocaleDateString("pt-PT"),
        },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [orders]);

  const baseOrders = useMemo(() => {
    const q = query.trim();
    return q ? fuse.search(q).map((r) => r.item) : (orders ?? []);
  }, [query, orders, fuse]);

  const hasCancelledInBase = useMemo(
    () => baseOrders.some((o) => o.status === "cancelled"),
    [baseOrders]
  );

  const filteredOrders = useMemo(() => {
    return hideCancelled ? baseOrders.filter((o) => o.status !== "cancelled") : baseOrders;
  }, [baseOrders, hideCancelled]);

  if (!orders || orders.length === 0) {
    return <div className={styles.info}>Ainda não fizeste nenhuma encomenda.</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>As Minhas Encomendas</h2>

      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar por número, produto, estado ou data..."
          aria-label="Pesquisar encomendas"
        />

        <div className={styles.filter}>
          <button
            type="button"
            className={styles.filterBtn}
            disabled={!hasCancelledInBase}
            onClick={() => setHideCancelled((v) => !v)}
            aria-pressed={!hideCancelled}>
            {hideCancelled ? "Mostrar canceladas" : "Ocultar canceladas"}
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.info}>Nenhuma encomenda encontrada.</div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Produtos</th>
                <th>Data</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td className={styles.productsList}>
                    <span className={styles.productItem}>{getCompactProductsSummary(order)}</span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString("pt-PT")}</td>
                  <td>{order.total_amount.toFixed(2)}€</td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td>
                    <Link href={`/my-orders?orderId=${order.id}`} className={styles.link}>
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
