"use client";
import { useState, useMemo } from "react";
import styles from "@/styles/components/shop/OrdersTable.module.css";
import { Order, OrderStatus } from "@/types/shop";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import { getCompactProductsSummary } from "@/utils/shopUtils";
import Fuse from "fuse.js";
import Link from "next/link";

interface OrdersTableProps {
  orders: Order[];
  showActions?: boolean;
}

export default function OrdersTable({ orders, showActions = true }: OrdersTableProps) {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const fuse = useMemo(
    () =>
      new Fuse(orders, {
        keys: [
          "customer_email",
          "customer_name",
          "user_istid",
          "order_number",
          "items.product_name",
          "items.variant_label",
          {
            name: "items.variant_options",
            getFn: (o: Order) =>
              o.items.map((it) => Object.values(it.variant_options || {}).join(" ")).join(" "),
          },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [orders]
  );

  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        products.add(item.product_name);
      });
    });
    return Array.from(products).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (search.trim()) {
      const results = fuse.search(search.trim());
      filtered = results.map((r) => r.item);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (productFilter !== "all") {
      filtered = filtered.filter((order) =>
        order.items.some((item) => item.product_name === productFilter)
      );
    }

    return filtered;
  }, [orders, search, fuse, statusFilter, productFilter]);

  if (!orders || orders.length === 0) {
    return <div className={styles.info}>Não existem encomendas.</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Todas as Encomendas</h2>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Procurar por email, nome, ISTID ou nº encomenda"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Pesquisar encomendas"
        />
        <div className={styles.filter}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="statusFilter">
              Estado:
            </label>
            <select
              id="statusFilter"
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
              aria-label="Filtrar por estado">
              <option value="all">Todos os estados</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="preparing">A preparar</option>
              <option value="ready">Pronto</option>
              <option value="delivered">Entregue</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="productFilter">
              Produto:
            </label>
            <select
              id="productFilter"
              className={styles.filterSelect}
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              aria-label="Filtrar por produto">
              <option value="all">Todos os produtos</option>
              {uniqueProducts.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== "all" || productFilter !== "all" || search.trim()) && (
            <button
              className={styles.filterBtn}
              onClick={() => {
                setStatusFilter("all");
                setProductFilter("all");
                setSearch("");
              }}
              type="button">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className={styles.resultsCount}>
        {filteredOrders.length} de {orders.length} encomendas
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Número</th>
            <th>Data</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Produtos</th>
            <th>Total</th>
            <th>Estado</th>
            {showActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td>{new Date(order.created_at).toLocaleDateString("pt-PT")}</td>
              <td>{order.customer_name}</td>
              <td>{order.customer_email}</td>
              <td className={styles.productsList}>
                <span className={styles.productItem}>{getCompactProductsSummary(order)}</span>
              </td>
              <td>{order.total_amount.toFixed(2)}€</td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              {showActions && (
                <td>
                  <Link href={`/orders?orderId=${order.id}`} className={styles.link}>
                    Gerir
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {filteredOrders.length === 0 && (
        <div className={styles.info}>Nenhuma encomenda encontrada com os filtros aplicados.</div>
      )}
    </div>
  );
}
