"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/styles/components/shop/OrderDetailsOverlay.module.css";
import { Order, OrderStatus } from "@/types/shop";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

function formatVariant(options?: Record<string, string>, label?: string) {
  if (label) return label;
  if (!options) return "-";
  return Object.entries(options)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

interface OrderDetailOverlayProps {
  orderId: number;
  orders: Order[];
  canManage?: boolean;
  basePath: string;
}

export default function OrderDetailOverlay({
  orderId,
  orders,
  canManage = false,
  basePath,
}: OrderDetailOverlayProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrder(orders.find((o) => o.id === orderId) || null);
  }, [orderId, orders]);

  const handleClose = () => router.push(basePath);

  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    setError(null);
    const res = await fetch(`/api/shop/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      router.refresh();
    } else setError("Erro ao atualizar estado.");
  };

  const canSetPaid =
    canManage &&
    order &&
    !["paid", "preparing", "ready", "delivered", "cancelled"].includes(order.status);
  const canSetDelivered =
    canManage &&
    order &&
    !["delivered", "cancelled"].includes(order.status) &&
    ["paid", "preparing", "ready"].includes(order.status);

  if (!order) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div style={{ textAlign: "center", padding: "2rem" }}>Encomenda não encontrada.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>
          &times;
        </button>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <div className={styles.label}>Encomenda</div>
              <h2>#{order.order_number}</h2>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className={styles.grid}>
            <div>
              <div className={styles.label}>Nome</div>
              <div>{order.customer_name}</div>
            </div>
            <div>
              <div className={styles.label}>IST ID</div>
              <div>{order.user_istid}</div>
            </div>
            <div>
              <div className={styles.label}>Campus</div>
              <div>{order.campus || "-"}</div>
            </div>
            <div>
              <div className={styles.label}>Email</div>
              <div>{order.customer_email}</div>
            </div>
            <div>
              <div className={styles.label}>Telefone</div>
              <div>{order.customer_phone || "-"}</div>
            </div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Itens da Encomenda</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Variante</th>
                <th>Qtd</th>
                <th>Preço</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product_name}</td>
                  <td>{formatVariant(item.variant_options, item.variant_label)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price.toFixed(2)}€</td>
                  <td>{(item.unit_price * item.quantity).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.total}>
            <span>Total:</span>
            <span>{order.total_amount.toFixed(2)}€</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.label}>Estado & Cronologia</div>
          <div className={styles.statusRow}>
            <label>
              <input
                type="checkbox"
                checked={["paid", "preparing", "ready", "delivered"].includes(order.status)}
                onChange={() => canSetPaid && handleStatusChange("paid")}
                disabled={!canSetPaid}
              />
              Pago
            </label>
            <label>
              <input
                type="checkbox"
                checked={order.status === "delivered"}
                onChange={() => canSetDelivered && handleStatusChange("delivered")}
                disabled={!canSetDelivered}
              />
              Entregue
            </label>
            <button
              className={styles.cancelBtn}
              onClick={() => setShowCancelConfirm(true)}
              disabled={order.status === "cancelled"}>
              Cancelar
            </button>
          </div>
          <div className={styles.timeline}>
            <div>
              <span className={styles.label}>Criada em </span>
              <span>{new Date(order.created_at).toLocaleString("pt-PT")}</span>
            </div>
            {order.paid_at && (
              <div>
                <span className={styles.label}>
                  Pagamento Verificado por {order.payment_checked_by}{" "}
                </span>
                <span> em {new Date(order.paid_at).toLocaleString("pt-PT")}</span>
              </div>
            )}
            {order.delivered_at && (
              <div>
                <span className={styles.label}>Entregue por {order.delivered_by} </span>
                <span> em {new Date(order.delivered_at).toLocaleString("pt-PT")}</span>
              </div>
            )}
          </div>
        </div>
        <ConfirmDialog
          open={showCancelConfirm}
          message="Tem a certeza que quer cancelar esta encomenda?"
          onConfirm={async () => {
            await handleStatusChange("cancelled");
            setShowCancelConfirm(false);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
